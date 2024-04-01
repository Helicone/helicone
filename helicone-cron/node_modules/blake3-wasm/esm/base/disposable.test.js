var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { using } from '../node.js';
import { expect } from 'chai.js';
describe('disposable', () => {
    describe('using', () => {
        let disposed;
        let disposable;
        beforeEach(() => {
            disposed = false;
            disposable = { dispose: () => (disposed = true) };
        });
        it('disposes after sync call', () => {
            const v = using(disposable, d => {
                expect(d).to.equal(disposable);
                expect(disposed).to.be.false;
                return 42;
            });
            expect(v).to.equal(42);
            expect(disposed).to.be.true;
        });
        it('disposes after sync throw', () => {
            const err = new Error();
            try {
                using(disposable, () => {
                    throw err;
                });
                throw new Error('expected to throw');
            }
            catch (e) {
                expect(e).to.equal(err);
            }
            expect(disposed).to.be.true;
        });
        it('disposes after promise resolve', () => __awaiter(void 0, void 0, void 0, function* () {
            const v = yield using(disposable, () => __awaiter(void 0, void 0, void 0, function* () {
                yield Promise.resolve();
                expect(disposed).to.be.false;
                return 42;
            }));
            expect(v).to.equal(42);
            expect(disposed).to.be.true;
        }));
        it('disposes after promise reject', () => __awaiter(void 0, void 0, void 0, function* () {
            const err = new Error();
            try {
                yield using(disposable, () => __awaiter(void 0, void 0, void 0, function* () {
                    yield Promise.resolve();
                    expect(disposed).to.be.false;
                    throw err;
                }));
                throw new Error('expected to throw');
            }
            catch (e) {
                expect(e).to.equal(err);
            }
            expect(disposed).to.be.true;
        }));
    });
});
//# sourceMappingURL=disposable.test.js.map