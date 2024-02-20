export class PaginationDto<T> {
  rows: Array<T>
  count: number
  pageSize: number
  pageIndex: number
}
