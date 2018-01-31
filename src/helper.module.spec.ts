import { HelperModule, IIdsActions } from './helper.module';


describe('Helper Module', () => {
    const ARRAY_STRING = 'array';
    const OBJECT_STRING = 'object';
    const BOOLEAN_STRING = 'boolean';
    let helperModule: HelperModule;
    beforeAll(() => {
        helperModule = new HelperModule();
    });

    it('should processArray with correct result 1', async () => {
        const answer = helperModule.processArray([{id: true}], []);

        expect(Array.isArray(answer)).toBe(true);
        expect(answer[0].location).toBe(BOOLEAN_STRING);
        expect(answer[0].type).toBe(BOOLEAN_STRING);
        expect(answer[1].location).toBe('id');
        expect(answer[1].type).toBe(OBJECT_STRING);
        expect(answer[2].location).toBe(0);
        expect(answer[2].type).toBe(ARRAY_STRING);
    });

    it('should processArray with correct result 2', async () => {
        const answer = helperModule.processArray([{data: {id: true}}], []);

        expect(Array.isArray(answer)).toBe(true);
        expect(answer[0].location).toBe(BOOLEAN_STRING);
        expect(answer[0].type).toBe(BOOLEAN_STRING);
        expect(answer[1].location).toBe('id');
        expect(answer[1].type).toBe(OBJECT_STRING);
        expect(answer[2].location).toBe('data');
        expect(answer[2].type).toBe(OBJECT_STRING);
        expect(answer[3].location).toBe(0);
        expect(answer[3].type).toBe(ARRAY_STRING);
    });

    it('should processArray fail with null', async () => {
        const answer = helperModule.processArray(null, null);

        expect(answer).toBe(null);
    });

    it('should processArray fail with empty array', async () => {
        const answer = helperModule.processArray([], []);

        expect(Array.isArray(answer)).toBe(true);
        expect(answer.length).toBe(0);
    });

    it('should processObject with correct result 1', async () => {
        const answer = helperModule.processObject({data: [{id: true}]}, []);

        expect(Array.isArray(answer)).toBe(true);
        expect(answer[0].location).toBe(BOOLEAN_STRING);
        expect(answer[0].type).toBe(BOOLEAN_STRING);
        expect(answer[1].location).toBe('id');
        expect(answer[1].type).toBe(OBJECT_STRING);
        expect(answer[2].location).toBe(0);
        expect(answer[2].type).toBe(ARRAY_STRING);
        expect(answer[3].location).toBe('data');
        expect(answer[3].type).toBe(OBJECT_STRING);
    });

    it('should processObject with correct result 2', async () => {
        const answer = helperModule.processObject({id: true}, []);

        expect(Array.isArray(answer)).toBe(true);
        expect(answer[0].location).toBe(BOOLEAN_STRING);
        expect(answer[0].type).toBe(BOOLEAN_STRING);
        expect(answer[1].location).toBe('id');
        expect(answer[1].type).toBe(OBJECT_STRING);
    });

    it('should processInputActions with correct result 1', async () => {
        const inputActions: IIdsActions[] = [
            {
                location: 'boolean',
                type: 'boolean'
            },
            {
                location: 'id',
                type: 'object'
            },
            {
                location: 'data',
                type: 'object'
            }
        ];

        const answer = HelperModule.processInputActions({
            data: {
                id: [2, 4, 23, 876]
            }
        }, inputActions.reverse());

        expect(Array.isArray(answer)).toBe(true);
        expect(answer).toEqual([2, 4, 23, 876]);
    });

    it('should processInputActions with correct result 2', async () => {
        const inputActions: IIdsActions[] = [
            {
                location: 'boolean',
                type: 'boolean'
            }
        ];

        const answer = HelperModule.processInputActions([1, 2, 3, 4], inputActions.reverse());

        expect(Array.isArray(answer)).toBe(true);
        expect(answer).toEqual([1, 2, 3, 4]);
        expect(answer.singular).not.toBeDefined();
    });

    it('should processInputActions with correct result 3', async () => {
        const inputActions: IIdsActions[] = [
            {
                location: 'id',
                type: 'object'
            }
        ];

        const answer = HelperModule.processInputActions({
            id: 3
        }, inputActions.reverse());

        expect(Array.isArray(answer)).toBe(true);
        expect(answer[0]).toEqual(3);
        expect(answer.singular).toBe(true);
    });

    it('should processInputActions with empty array', async () => {
        const answer = HelperModule.processInputActions([1, 2, 3, 4], null);

        expect(Array.isArray(answer)).toBe(true);
        expect(answer.length).toBe(0);
    });

    it('should processInputActions with array not as singular', async () => {
        const inputActions: IIdsActions[] = [
            {
                location: 'boolean',
                type: 'boolean'
            },
            {
                location: 'id',
                type: 'object'
            }
        ];
        const answer = HelperModule.processInputActions({
            id: [1, 2, 3, 4]
        }, inputActions.reverse());

        expect(Array.isArray(answer)).toBe(true);
        expect(answer.length).toBeGreaterThan(3);
        expect(answer.singular).not.toBe(false);
    });
});