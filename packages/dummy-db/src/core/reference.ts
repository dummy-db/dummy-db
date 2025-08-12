export abstract class Reference {
  constructor(private _id: string) {}

  get id(): string {
    return this._id
  }

  abstract get path(): string
}
