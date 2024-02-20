export class ResultDto<T> {
  success: boolean
  message: string
  data?: T
}
