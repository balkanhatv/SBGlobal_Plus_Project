export interface SqlQueryResult<Row> {
  readonly rows: readonly Row[];
  readonly rowCount: number;
}

export interface SqlTransaction {
  query<Row = Readonly<Record<string, unknown>>>(
    text: string,
    parameters?: readonly unknown[],
  ): Promise<SqlQueryResult<Row>>;
}

export interface SqlDatabase {
  transaction<T>(work: (transaction: SqlTransaction) => Promise<T>): Promise<T>;
}
