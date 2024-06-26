"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const clubSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Club name is required'],
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: Number,
    },
    contact: {
        name: String,
        phone: {
            type: String,
            validate: {
                validator: (v) => {
                    return /\d{3}-\d{3}-\d{4}/.test(v);
                },
                message: 'Supplied phone number is not a valid phone number',
            },
        },
    },
    shifts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Shift', default: [] }],
    distance: Number,
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    isArchived: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
clubSchema.index({ userId: 1 });
exports.default = (0, mongoose_1.model)('Club', clubSchema);
//# sourceMappingURL=Club.js.map