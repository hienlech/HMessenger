const MessageService = require('../Message/MessageService');

describe('Message Service', async () => {
    await it('Get last mesage should return 1 message ', async () => {
        let getter = 'hien',
            username = 'tu';
        MessageService.GetAllMessage = (getter, username) => {
            return [{
                _id: "5c6aa1815ac4ba38406bae6f",

                type: "text",
                sender: "hien",
                sendTime: "2019 - 02 - 18 12: 13: 53.646",
                roomId: "hientuhien",
                content: "sao không hiện",
                __v: 0
            }]

        }
        let result = await MessageService.GetLastMessage('hien', 'tu');
        expect(result).toEqual({
            _id: "5c6aa1815ac4ba38406bae6f",

            type: "text",
            sender: "hien",
            sendTime: "2019 - 02 - 18 12: 13: 53.646",
            roomId: "hientuhien",
            content: "sao không hiện",
            __v: 0
        });


    })

    await it('GetAllMessage should return list of mesage', async () => {
        let ListMessage = [{
            sender: "test",
            content: "ahihi",
            type: "ưeq",
            roomId: "qrfwf",
            sendTime: "ềnlsf",
            senderDetail: {
                fullname: "fdsf",
                imageUrl: "dsfsd"
            }
        }];

        let findMock = jest.fn();

        findMock.mockResolvedValue(ListMessage);
        MessageService.Message.find = findMock;
        let AggregateMock = jest.fn();
        AggregateMock.mockResolvedValue(ListMessage);
        MessageService.Message.aggregate = AggregateMock;
        let result = await MessageService.GetAllMessage('qưerty');
        expect(result).toMatchObject(ListMessage);
    });
})