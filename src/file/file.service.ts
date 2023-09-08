/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { config } from 'dotenv';
import {
    access,
    constants,
    createReadStream,
    existsSync,
    mkdirSync,
    readdirSync,
    renameSync,
    rmdirSync,
    unlinkSync,
    writeFileSync,
} from 'fs';
// Node JS libraries
import { join, normalize, resolve } from 'path';
import { Not, Repository } from 'typeorm';
// LIST libraries
import { FwaException } from '../FWAjs-utils';
import DatabaseQueryError, {
    DatabaseQueryDriver,
} from '../FWAjs-utils/exceptions/database';
import { TokenPayload } from '../FWAjs-utils/utils/auth.interface';
// DTOs
import {
    DeleteDto,
    DeleteRepositoryDto,
    DeleteRepositoryResponse,
    DeleteResponse,
} from './dto/delete.dto';
import { GetOneDto, MetadataResponse, StreamResponse } from './dto/get-one.dto';
import { ListDto, ListResponse } from './dto/list.dto';
import {
    UpdateDto,
    UploadDto,
    UploadMetadataDto,
    UploadResponse,
} from './dto/upload.dto';
// Entity
import { File } from './entities/file.entity';

const envPath = resolve(
    process.env.NODE_ENV === 'production' ? '.env' : '.env.dev',
);
const cfg = config({
    path: envPath,
}).parsed;

const base64Pattern = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

const DatabaseError = DatabaseQueryError(DatabaseQueryDriver.typeorm);

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------    

    constructor(
        @InjectRepository(File)
        private readonly fileRepo: Repository<File>,
        private readonly jwtService: JwtService,
    ) {
        // Check if node process has access to the file-system directory
        // The file system must be owned by the current user (chown $USER:$USER -r /var/data/file-system)
        access(cfg.FILE_SYSTEM_PATH, constants.F_OK, (err) => {
            if (err)
                this.logger.error(
                    `The current user has no rights in read/write mode for the repository: ${cfg.FILE_SYSTEM_PATH}`,
                );
            else this.logger.log(`File system access: OK`);
        });
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------
    /**
     * This function contact the fileSystem constant to the path to access and format/normalize the full URL.
     *
     * Example: this.getPath("/dir1", "dir2", "/dir3", "file.txt") = /file-system/dir1/dir2/dir3/file.txt on Linux
     *
     * @param params An ordered list of sub-directory to access a specific directory/path
     * @returns The absolute path to the file/directory
     */
    //-----------------------------------------------------------------------    

    private getPath(...params: string[]) {
        return normalize(join(cfg.FILE_SYSTEM_PATH, ...params));
    }

    //-----------------------------------------------------------------------    
    /**
     * Slugify a string
     * @param str The input string
     * @returns The string formatted for technical actions (e.g. a file-system)
     */
    //-----------------------------------------------------------------------    

    private slugify(str: string) {
        // Trim and lower case
        str = str.trim();
        str = str.toLowerCase();

        // Remove accents, swap ñ for n, etc
        var from =
            'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;';
        var to =
            'AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------';
        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        // Remove invalid chars
        str = str
            .replace(/[^a-z0-9 -]/g, '')
            // Collapse whitespace and replace by -
            .replace(/\s+/g, '-')
            // Collapse dashes
            .replace(/-+/g, '-');

        return str;
    }

    //-----------------------------------------------------------------------    

    private async verifyToken(token: string): Promise<TokenPayload> {
        if (token.startsWith('Bearer ')) token = token.replace('Bearer ', '');
        let payload: TokenPayload = await this.jwtService.verifyAsync(token);
        if (!payload)
            throw FwaException({
                code: HttpStatus.UNAUTHORIZED,
                message: `Not allowed to upload a file`,
                messageCode: 'notAllowedToUploadFile',
            });
        return payload;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //----------------------------------------------------------------------- 

    async upload(dto: UploadDto): Promise<UploadResponse> {
        // The object where the database response is stored, used by the return and the fallback mechanism.
        let fileRecord;
        try {
            const { file, metadata, token } = dto;
            const tokenPayload = await this.verifyToken(token);
            const uploadedAt = new Date().toISOString();

            // The record to save in the database
            const record: UploadMetadataDto = {
                ...metadata,
                originalName: file.originalname,
                name: this.slugify(metadata.name),
                size: file.size,
                fileType: file.mimetype,
                uploadedAt: uploadedAt,
                uploadedBy: tokenPayload.user.id,
            };

            // Get the file path
            const filePath = this.getPath(record.filePath, record.name);

            // Save the file record in the DB and the file in the file-system

            // Check if the "name" + "file path" already exists
            const found = await this.fileRepo.findOne({
                name: record.name,
                filePath: record.filePath,
            });
            // Abort action if the UUID is missing in the request.
            if (found)
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `A file with the same name already exists at the file location: "${record.filePath}".`,
                    messageCode: 'fileNameConflict',
                    messageData: {
                        location: record.filePath,
                    },
                });

            // Create the full path if it doesn't already exist.
            const dirPath = this.getPath(record.filePath);
            if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

            fileRecord = await this.fileRepo.save(record);
            const fileBuffer = file.buffer.toString();
            if (base64Pattern.test(fileBuffer)) {
                await writeFileSync(filePath, Buffer.from(fileBuffer, 'base64'));
            } else {
                await writeFileSync(filePath, file.buffer);
            }


            return fileRecord;
        } catch (error) {
            console.error(error);
            if (!!fileRecord && 'uuid' in fileRecord)
                await this.fileRepo.delete(fileRecord.uuid);

            if (
                error instanceof HttpException ||
                error instanceof RpcException
            ) {
                // TODO rollback procedure

                throw error;
            }
            let databaseError = DatabaseError(error);
            if (databaseError) throw databaseError;

            throw FwaException({
                message: 'Cannot update the file',
                messageCode: 'cannotUpdateFile',
            });
        }
    }

    //-----------------------------------------------------------------------    

    async update(dto: UpdateDto): Promise<UploadResponse> {
        let previousFile;
        let updatedFileRecord;
        try {
            const { file, metadata, token } = dto;
            const tokenPayload = await this.verifyToken(token);
            const uploadedAt = new Date().toISOString();

            // Get the current record in the database
            const fileRecord = await this.fileRepo.findOne(metadata.uuid);

            // Set up the new file record
            let newFileRecord = Object.assign({}, fileRecord);

            // Replace the uploadedAt & uploadedBy
            newFileRecord.uploadedAt = new Date(uploadedAt);    // NMA: Temporary fix
            newFileRecord.uploadedBy = tokenPayload.user.id;

            if (file) {
                newFileRecord.originalName = file.originalname;
                newFileRecord.size = file.size;
                newFileRecord.fileType = file.mimetype;
            }

            const filename = this.slugify(metadata.name);

            // Check if there is another file with the same name at the file location
            if (filename && filename !== fileRecord.name) {
                newFileRecord.name = filename;
                const found = await this.fileRepo.findOne({
                    where: {
                        name: filename,
                        filePath: metadata.filePath,
                        uuid: Not(metadata.uuid),
                    },
                });
                if (found)
                    throw FwaException({
                        code: HttpStatus.CONFLICT,
                        message: `A file with the same name already exists at the file location: "${metadata.filePath}".`,
                        messageCode: 'fileNameConflict',
                        messageData: {
                            location: metadata.filePath,
                        },
                    });
            }

            if (metadata.filePath || metadata.name) {
                // Replace or "remove and add"
                newFileRecord.fileType = metadata.fileType;

                // Get the file path
                const previousFilePath = this.getPath(
                    fileRecord.filePath,
                    fileRecord.name,
                );
                const newFilePath = this.getPath(
                    newFileRecord.filePath,
                    newFileRecord.name,
                );
                if (
                    // replace
                    (newFilePath === previousFilePath && file) ||
                    // remove and add
                    (newFilePath !== previousFilePath && file)
                ) {
                    // Check if the file exists at the file path
                    if (!existsSync(previousFilePath))
                        throw FwaException({
                            code: HttpStatus.NOT_FOUND,
                            message: `File not found at location: ${previousFilePath}`,
                            messageCode: 'fileNotFound',
                            messageData: {
                                location: previousFilePath,
                            },
                        });

                    // Read the file at previousfilePath as a stream (byte[]) [fallback method]
                    previousFile = createReadStream(previousFilePath);
                    unlinkSync(previousFilePath);

                    // Create the full path if it doesn't already exist.
                    const dirPath = this.getPath(newFileRecord.filePath);
                    if (!existsSync(dirPath))
                        mkdirSync(dirPath, { recursive: true });

                    // Save the file in the file system
                    const fileBuffer = file.buffer.toString();
                    if (base64Pattern.test(fileBuffer)) {
                        await writeFileSync(newFilePath, Buffer.from(fileBuffer, 'base64'));
                    } else {
                        await writeFileSync(newFilePath, fileBuffer);
                    }
                }
                // move
                else if (newFilePath !== previousFilePath && !file) {
                    // Move the file from previous file path to the new file path
                    // Attention: it doesn't work with different partition

                    await renameSync(previousFilePath, newFilePath);
                }
            }

            // Save the new file record in the database
            updatedFileRecord = await this.fileRepo.save(newFileRecord);

            return updatedFileRecord;
        } catch (error) {
            console.error(error);
            if (
                error instanceof HttpException ||
                error instanceof RpcException
            ) {
                // TODO rollback procedure

                throw error;
            }
            let databaseError = DatabaseError(error);
            if (databaseError) throw databaseError;

            throw FwaException({
                message: 'Cannot update the file',
                messageCode: 'cannotUpdateFile',
            });
        }
    }

    //-----------------------------------------------------------------------    
    // List files metadata based on a query
    //-----------------------------------------------------------------------    

    async list(dto: ListDto): Promise<ListResponse> {
        try {
            // Remove the token from the dto object
            const token = dto.token;
            delete dto.token;

            // Get the database file records
            const fileRecords = await this.fileRepo.find(dto);
            if (fileRecords.length === 0) return [];

            // Get the file path for each file and check if all of them exist in the file system
            fileRecords.forEach((fileRecord) => {
                const filePath = this.getPath(
                    fileRecord.filePath,
                    fileRecord.name,
                );
                if (!existsSync(filePath))
                    throw FwaException({
                        code: HttpStatus.NOT_FOUND,
                        message: `File not found at location: ${filePath}`,
                        messageCode: 'fileNotFound',
                        messageData: {
                            filePath,
                        },
                    });
            });

            return fileRecords;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    //-----------------------------------------------------------------------    
    // Find one file and return the associated metadata
    //-----------------------------------------------------------------------    

    async metadata(dto: GetOneDto): Promise<MetadataResponse> {
        try {
            // Remove the token from the query object
            const token = dto.token;
            delete dto.token;
            /*const tokenPayload = */ await this.verifyToken(token);

            // Find the file record (database)
            const fileRecord = await this.fileRepo.findOne({ uuid: dto.uuid });
            if (!fileRecord)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: `File not found in the database`,
                    messageCode: 'fileNotFound',
                });

            // Get the file path and check if the file exists
            const filePath = this.getPath(fileRecord.filePath, fileRecord.name);
            if (!existsSync(filePath))
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: `File not found at location: ${filePath}`,
                    messageCode: 'fileNotFound',
                    messageData: {
                        filePath,
                    },
                });

            return fileRecord;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    //-----------------------------------------------------------------------    
    // TODO test this function with a frontend served by Nginx
    // https://lifesaver.codes/answer/net-err-content-length-mismatch
    // Find one file and return the file as a stream (raw)
    //-----------------------------------------------------------------------    

    async stream(dto: GetOneDto): Promise<StreamResponse> {
        try {
            // Remove the token from the dto object
            const token = dto.token;
            delete dto.token;
            /*const tokenPayload = */ await this.verifyToken(token);

            // Find the file record (database)
            const fileRecord = await this.fileRepo.findOne(dto.uuid);
            if (!fileRecord)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: `File not found in the database`,
                    messageCode: 'fileNotFound',
                });

            // Get the file path and check if the file exists
            const filePath = this.getPath(fileRecord.filePath, fileRecord.name);
            if (!existsSync(filePath))
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: `File not found at location: ${filePath}`,
                    messageCode: 'fileNotFound',
                    messageData: {
                        filePath,
                    },
                });

            // No need : Get the file stats and replace the file record size by the the file stats size.
            // const fileStats = statSync(filePath);
            // fileRecord.size = fileStats.size;

            // Read the file at filePath as stream (byte[])
            const file = createReadStream(filePath);

            return {
                stream: file,
                metadata: fileRecord,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    //-----------------------------------------------------------------------    

    async delete(dto: DeleteDto): Promise<DeleteResponse> {
        let file;
        try {
            // Remove the token from the dto object
            const token = dto.token;
            delete dto.token;
            /*const tokenPayload = */ await this.verifyToken(token);

            // Find the file record
            const fileRecord = await this.fileRepo.findOne(dto.uuid);
            if (!fileRecord) throw new Error('File not found');

            // Get the file path and check if the file exists
            const filePath = this.getPath(fileRecord.filePath, fileRecord.name);
            if (!existsSync(filePath))
                throw new Error(`File not found at location: ${filePath}`);

            // Read the file at filePath as a stream (byte[]) [fallback method]
            //file = createReadStream(filePath);
            unlinkSync(filePath);

            await this.fileRepo.delete(dto.uuid);

            return fileRecord;
        } catch (error) {
            console.error(error);
            if (file !== null) {
                // TODO
                // upload the file
                // return failed fwa_exception
            }
            throw error;
        }
    }

    //-----------------------------------------------------------------------    

    async deleteRepository(
        dto: DeleteRepositoryDto,
    ): Promise<DeleteRepositoryResponse> {
        try {
            // Get the repository path and check if it exists
            const repositoryPath = this.getPath(dto.path);
            if (!existsSync(repositoryPath))
                throw new Error(
                    `Repository not found at location: ${repositoryPath}`,
                );

            // Check if the repository path is empty
            if (readdirSync(repositoryPath).length !== 0)
                throw new Error(
                    `Cannot delete the repository "${repositoryPath}", repository not empty`,
                );

            // Remove the directory
            rmdirSync(repositoryPath);
            return true;
        } catch (error) {
            console.error(error);
            return error;
        }
    }
}
