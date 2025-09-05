import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Request, Put, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileSettingsDto } from './dto/profile-settings.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @HttpCode(HttpStatus.OK)
  @Post('register')
  create(@Body() createUserDto: RegisterUserDto) {
    return this.userService.register(createUserDto);
  }

  @Put('profile-settings')
  async updateProfileSettings(@Request() req, @Body() dto: ProfileSettingsDto) {
    return this.userService.updateProfileSettings(req.user.userId, dto);
  }

  @Get('profile-settings')
  async findProfileSettings(@Request() req) {
    return this.userService.findProfileSettings(req.user.userId);
  }

  @Put('avatar')
  @UseInterceptors(FileInterceptor('image', {
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
      callback(null, true);
    }
  }))
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('avatarUrl') avatarUrl: string,
    @Req() req: any,
  ) {
    return this.userService.uploadAvatar(req.user.userId, file, avatarUrl);
  }


  @Get('general-information')
  findGeneralInformation(@Request() req) {
    return this.userService.findGeneralInformation(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
