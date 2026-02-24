import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Idiom } from './entities/Idiom.model'
import { IdiomHandle } from './entities/IdiomHandle.model'
import { IdiomController } from './Idiom.controller'
import { IdiomService } from './Idiom.service'

@Module({
  imports: [SequelizeModule.forFeature([IdiomHandle, Idiom])],
  controllers: [IdiomController],
  providers: [IdiomService],
})
export class IdiomModule {}
