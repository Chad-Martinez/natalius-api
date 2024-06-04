import { Types } from 'mongoose';
import { EnumType } from 'typescript';

export interface IExpense {
  vendorId: Types.ObjectId;
  date: Date;
  amount: Number;
  type: EnumType;
  notes: String;
  userId: Types.ObjectId;
}
