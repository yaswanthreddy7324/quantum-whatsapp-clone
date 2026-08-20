class MockModel {
    constructor(collectionName, data = []) {
        this.collection = data;
        this.collectionName = collectionName;
    }

    async find(query = {}, select = '') {
        let results = [...this.collection];

        // Basic query support ($or, simple match)
        if (query.$or) {
            results = results.filter(item => {
                return query.$or.some(q => {
                    return Object.keys(q).every(key => String(item[key]) === String(q[key]));
                });
            });
        } else if (Object.keys(query).length > 0) {
            results = results.filter(item => {
                return Object.keys(query).every(key => item[key] === query[key]);
            });
        }

        return results;
    }

    async findOne(query = {}) {
        const results = await this.find(query);
        return results[0] || null;
    }

    async findByIdAndUpdate(id, update) {
        const index = this.collection.findIndex(item => item._id === id);
        if (index !== -1) {
            this.collection[index] = { ...this.collection[index], ...update };
            return this.collection[index];
        }
        return null;
    }

    async updateMany(query, update) {
        const items = await this.find(query);
        items.forEach(item => {
            Object.assign(item, update);
        });
        return { modifiedCount: items.length };
    }

    // Mock constructor for new Doc()
    static createMockDelegate(collection) {
        return function (data) {
            const doc = {
                _id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                ...data,
                save: async function () {
                    const existingIndex = collection.findIndex(item => item._id === this._id);
                    if (existingIndex !== -1) {
                        collection[existingIndex] = { ...this };
                    } else {
                        collection.push({ ...this });
                    }
                    return this;
                }
            };
            return doc;
        };
    }
}

// In-memory storage
const users = [];
const messages = [];

const UserMock = MockModel.createMockDelegate(users);
// Copy methods to the constructor function (like Mongoose)
Object.assign(UserMock, new MockModel('User', users));
// Ensure methods from prototype are also available
Object.getOwnPropertyNames(MockModel.prototype).forEach(name => {
    if (name !== 'constructor') {
        UserMock[name] = MockModel.prototype[name].bind(new MockModel('User', users));
    }
});

const MessageMock = MockModel.createMockDelegate(messages);
Object.assign(MessageMock, new MockModel('Message', messages));
Object.getOwnPropertyNames(MockModel.prototype).forEach(name => {
    if (name !== 'constructor') {
        MessageMock[name] = MockModel.prototype[name].bind(new MockModel('Message', messages));
    }
});

module.exports = {
    User: UserMock,
    Message: MessageMock,
    isMock: true
};
