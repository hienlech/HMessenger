const MessageService = require('../Message/MessageService');
const Users = require('../authentication/User');

describe('Message Service', () => {
    afterAll(async () => {
        await MessageService.mongoose.disconnect();
    })

    let ListMessage = [{
        sender: "test",
        content: "ahihi",
        type: "ưeq",
        roomId: "qrfwf",
        sendTime: "ềnlsf",
        Sender: [{
            fullname: "fsdfds",
            imageUrl: "ewufewfwfe"
        }]
    }];
    // it('GetAllMessage should return list of mesage', async (done) => {


    //     let AggregateMock = jest.fn();
    //     AggregateMock.mockResolvedValue(ListMessage);
    //     MessageService.Message.aggregate = AggregateMock;
    //     let result = await MessageService.GetAllMessage('qưerty');
    //     expect(result).toMatchObject([{
    //         sender: "test",
    //         content: "ahihi",
    //         type: "ưeq",
    //         roomId: "qrfwf",
    //         sendTime: "ềnlsf",
    //         senderDetail: {
    //             fullname: "fsdfds",
    //             imageUrl: "ewufewfwfe"
    //         }
    //     }]);
    //     await done();
    // });

    // it('Get last mesage should return 1 message ', async (done) => {





    //     let result = await MessageService.GetLastMessage('hien', 'tu');
    //     expect(result).toEqual({
    //         sender: "test",
    //         content: "ahihi",
    //         type: "ưeq",
    //         roomId: "qrfwf",
    //         sendTime: "ềnlsf",
    //         senderDetail: {
    //             fullname: "fsdfds",
    //             imageUrl: "ewufewfwfe"
    //         }
    //     });
    //     await done();

    // });




    // it("SaveMesage  Save method must be called", (done) => {
    //     let mess = {};
    //     mess.save = jest.fn();
    //     MessageService.SaveMessage(mess);
    //     expect(mess.save).toHaveBeenCalled();
    //     done();
    // })
})
describe('User', () => {
    afterAll(async () => {
        await Users.mongoose.disconnect();
    })
    it('Login must return true if exist in db', async (done) => {

        Users.ApplicationUser.find = function (data) {
            return [{
                name: "hien",
                password: "hien"
            }];
        }
        Users.bcrypt.compare = async (data, data2) => {
            if (data == "hien")
                return true;
            return false;
        }
        let result = await Users.Login({
            username: "hien",
            password: "hien"
        });
        expect(result).toEqual({
            name: "hien",
            password: "hien"
        });
        await done();

    })

    it('Login must false true if not exist in db', async (done) => {

        Users.ApplicationUser.find = function (data) {
            return [];
        }
        let result = await Users.Login({
            username: "dà",
            password: "ádfdsdf"
        });
        expect(result).toBeFalsy();
        await done();

    })
})