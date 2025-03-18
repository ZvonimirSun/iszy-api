import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Idiom } from '~entities/idiom/Idiom.model'
import { IdiomHandle } from '~entities/idiom/IdiomHandle.model'
import { IdiomController } from './Idiom.controller'
import { IdiomService } from './Idiom.service'

@Module({
  imports: [SequelizeModule.forFeature([IdiomHandle, Idiom])],
  controllers: [IdiomController],
  providers: [IdiomService],
})
export class IdiomModule {}
