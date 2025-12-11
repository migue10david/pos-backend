export type Pagination = {
    page: number;
    limit: number;
}

export type Filters = {
    [key: string]: string | number;
}