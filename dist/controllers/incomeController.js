"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIncome = exports.updateIncome = exports.addIncome = exports.getIncomeById = exports.getPaginatedIncome = exports.getIncomeByUser = void 0;
const mongoose_1 = require("mongoose");
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Income_1 = __importDefault(require("../models/Income"));
const Shift_1 = __importDefault(require("../models/Shift"));
const Sprint_1 = __importDefault(require("../models/Sprint"));
const dayjs_1 = __importDefault(require("dayjs"));
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
dayjs_1.default.extend(isBetween_1.default);
const getIncomeByUser = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const income = await Income_1.default.find({ userId: userId }, { __v: 0 })
            .sort({
            date: 1,
        })
            .populate({
            path: 'gigId',
            select: { name: 1 },
        })
            .exec();
        const mappedIncome = income.map((income) => {
            const { _id, gigId, shiftId, date, amount, type, userId, created_at, updated_at } = income;
            return {
                _id,
                gig: {
                    _id: gigId === null || gigId === void 0 ? void 0 : gigId._id,
                    name: gigId === null || gigId === void 0 ? void 0 : gigId.name,
                },
                shiftId,
                date,
                amount,
                type,
                userId,
                created_at,
                updated_at,
            };
        });
        res.status(200).json({ income: mappedIncome });
    }
    catch (error) {
        console.error('Income Controller Error - IncomeByUser: ', error);
        next(error);
    }
};
exports.getIncomeByUser = getIncomeByUser;
const getPaginatedIncome = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        if (!page || !limit) {
            throw new HttpErrorResponse_1.default(400, 'Missing proper query parameters');
        }
        const count = await Income_1.default.find({ userId }).countDocuments();
        if (count) {
            const income = await Income_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                    },
                },
                {
                    $sort: {
                        date: -1,
                    },
                },
                {
                    $skip: (+page - 1) * +limit,
                },
                {
                    $limit: +limit,
                },
                {
                    $lookup: {
                        from: 'gigs',
                        localField: 'gigId',
                        foreignField: '_id',
                        as: 'gigDetails',
                    },
                },
                {
                    $unwind: '$gigDetails',
                },
                {
                    $lookup: {
                        from: 'shifts',
                        localField: 'shiftId',
                        foreignField: '_id',
                        as: 'shiftDetails',
                    },
                },
                {
                    $addFields: {
                        gig: '$gigDetails.name',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        gigId: 1,
                        gig: 1,
                        shiftId: 1,
                        shiftDetails: 1,
                        date: 1,
                        amount: 1,
                        type: 1,
                        notes: 1,
                    },
                },
            ]);
            res.status(200).json({ income, count, pages: Math.ceil(count / +limit) });
        }
        else {
            res.status(200).json({ income: [], count });
        }
    }
    catch (error) {
        console.error('Income Controller Error - PaginatedIncome: ', error);
        next(error);
    }
};
exports.getPaginatedIncome = getPaginatedIncome;
const getIncomeById = async (req, res, next) => {
    try {
        const { incomeId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(incomeId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const income = (await Income_1.default.findById(incomeId)
            .populate({
            path: 'gigId',
            select: { name: 1 },
        })
            .exec());
        if (!income)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        const { _id, gigId, shiftId, date, amount, type, userId, created_at, updated_at } = income;
        const mappedIncome = {
            _id,
            gig: {
                _id: gigId === null || gigId === void 0 ? void 0 : gigId._id,
                name: gigId === null || gigId === void 0 ? void 0 : gigId.name,
            },
            shiftId,
            date,
            amount,
            type,
            userId,
            created_at,
            updated_at,
        };
        res.status(200).json({ income: mappedIncome });
    }
    catch (error) {
        console.error('Income Controller Error - IncomeById: ', error);
        next(error);
    }
};
exports.getIncomeById = getIncomeById;
const addIncome = async (req, res, next) => {
    try {
        const { gigId, shiftId, date, amount, type } = req.body;
        const { userId } = req;
        const income = new Income_1.default({
            gigId,
            shiftId,
            date,
            amount,
            type,
            userId,
        });
        await income.save();
        if (shiftId) {
            const shift = await Shift_1.default.findById(shiftId);
            if (shift) {
                shift.incomeReported = true;
                await shift.save();
            }
        }
        const sprint = await Sprint_1.default.findOne({ userId: userId, isCompleted: false });
        if (sprint && (0, dayjs_1.default)(date).isBetween(sprint.start, sprint.end, null, '[]')) {
            sprint.incomes.push(income._id);
            await sprint.save();
        }
        res.status(201).json({ incomeId: income._id, message: 'Income added' });
    }
    catch (error) {
        console.error('Income Controller Error - AddIncome: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.addIncome = addIncome;
const updateIncome = async (req, res, next) => {
    try {
        const { _id, gigId, shiftId, date, amount, type } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const income = await Income_1.default.findById(_id);
        if (!income)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        income.gigId = gigId;
        income.shiftId = shiftId;
        income.date = date;
        income.amount = amount;
        income.type = type;
        await income.save();
        res.status(200).json({ message: 'Income updated' });
    }
    catch (error) {
        console.error('Income Controller Error - UpdateIncome: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.updateIncome = updateIncome;
const deleteIncome = async (req, res, next) => {
    try {
        const { incomeId } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(incomeId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const income = await Income_1.default.findById(incomeId);
        if (!income)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        if (income.shiftId) {
            const shift = await Shift_1.default.findById(income.shiftId);
            if (shift) {
                shift.incomeReported = false;
                await shift.save();
            }
        }
        await Income_1.default.deleteOne({ _id: incomeId });
        const sprint = await Sprint_1.default.findOne({ userId: income.userId });
        if (sprint) {
            sprint.incomes = sprint.incomes.filter((incomeId) => incomeId !== income._id);
            await sprint.save();
        }
        res.status(200).json({ message: 'Income deleted' });
    }
    catch (error) {
        console.error('Income Controller Error - DeleteIncome: ', error);
        next(error);
    }
};
exports.deleteIncome = deleteIncome;
exports.default = {
    getIncomeByUser: exports.getIncomeByUser,
    getIncomeById: exports.getIncomeById,
    addIncome: exports.addIncome,
    updateIncome: exports.updateIncome,
    deleteIncome: exports.deleteIncome,
};
//# sourceMappingURL=incomeController.js.map