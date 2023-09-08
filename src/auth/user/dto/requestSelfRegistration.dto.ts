/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { IsDataURI, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SelfRegistrationRequestDto {
	@IsString()
	@IsNotEmpty()
	readonly name: string;

	@IsString()
	@IsNotEmpty()
	readonly firstName: string;

	@IsString()
	@IsNotEmpty()
	readonly login: string;

	@IsEmail()
	@IsNotEmpty()
	readonly email: string;

	@IsDataURI()
	@IsNotEmpty()
	readonly source: string;
}
