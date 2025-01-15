import { encodeParam, decodeParam } from 'Router/_private/MaskResolver/Helpers';

describe('Router/_private/MaskResolver/Helpers', () => {
    describe('#encodeParam', () => {
        it('value with space', () => {
            const res = encodeParam('this value');
            expect(res).toEqual('this%20value');
        });
        it('value with slash', () => {
            const res = encodeParam('this/value');
            expect(res).toEqual('this%2Fvalue');
        });
    });
    describe('#decodeParam', () => {
        it('value with space', () => {
            const res = decodeParam('this%20value');
            expect(res).toEqual('this value');
        });
        it('value with slash', () => {
            const res = decodeParam('this%2Fvalue');
            expect(res).toEqual('this/value');
        });
    });
});
