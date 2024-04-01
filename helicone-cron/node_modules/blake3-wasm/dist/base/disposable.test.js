"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("../node");
const chai_1 = require("chai");
describe('disposable', () => {
    describe('using', () => {
        let disposed;
        let disposable;
        beforeEach(() => {
            disposed = false;
            disposable = { dispose: () => (disposed = true) };
        });
        it('disposes after sync call', () => {
            const v = node_1.using(disposable, d => {
                chai_1.expect(d).to.equal(disposable);
                chai_1.expect(disposed).to.be.false;
                return 42;
            });
            chai_1.expect(v).to.equal(42);
            chai_1.expect(disposed).to.be.true;
        });
        it('disposes after sync throw', () => {
            const err = new Error();
            try {
                node_1.using(disposable, () => {
                    throw err;
                });
                throw new Error('expected to throw');
            }
            catch (e) {
                chai_1.expect(e).to.equal(err);
            }
            chai_1.expect(disposed).to.be.true;
        });
        it('disposes after promise resolve', () => __awaiter(void 0, void 0, void 0, function* () {
            const v = yield node_1.using(disposable, () => __awaiter(void 0, void 0, void 0, function* () {
                yield Promise.resolve();
                chai_1.expect(disposed).to.be.false;
                return 42;
            }));
            chai_1.expect(v).to.equal(42);
            chai_1.expect(disposed).to.be.true;
        }));
        it('disposes after promise reject', () => __awaiter(void 0, void 0, void 0, function* () {
            const err = new Error();
            try {
                yield node_1.using(disposable, () => __awaiter(void 0, void 0, void 0, function* () {
                    yield Promise.resolve();
                    chai_1.expect(disposed).to.be.false;
                    throw err;
                }));
                throw new Error('expected to throw');
            }
            catch (e) {
                chai_1.expect(e).to.equal(err);
            }
            chai_1.expect(disposed).to.be.true;
        }));
    });
});
//# sourceMappingURL=disposable.test.js.map