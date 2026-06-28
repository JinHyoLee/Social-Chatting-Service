const express = require('express');
const http = require('http');
const app = express(); // express 서버 객체
const path = require('path');
const server = http.createServer(app);
const bodyParser = require('body-parser');
const moment = require('moment');

const socketIO = require('socket.io');

const socketConnect = (httpServer: any) => {
    const ioConnect = new socketIO.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    const io = ioConnect;
    return io;
};
const io = socketConnect(server);

// aws rds db 연결
const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '1234',
    database: 'chat',
    insecureAuth: true
});

app.use(bodyParser.json());
app.use('/pages', express.static(path.join(__dirname, 'src/pages')));
app.use('/css', express.static(path.join(__dirname, 'src/css')));   
app.use(express.static(path.join(__dirname, 'dist')));
const PORT = process.env.PORT || 5000;

let roomData: {
    members: string[];
    id: string;
}[] = [
    {
        members: [],
        id: '1',
    },
    {
        members: [],
        id: '2',
    },
];

// 로그인 페이지
// 로그인
app.post('/login', (req: { body: { id: any; password: any } }, res: { send: (arg0: { result: string }) => void }) => {
    // console.log(req.body);
    let id = req.body.id;
    let password = req.body.password;

    if (id && password) {
        db.query('SELECT * FROM usertable WHERE username = ? and password = ?;', [id, password], (err: any, results: string | any[]) => {
            if (results.length > 0) {
                res.send({ result: 'OK' });
            } else {
                res.send({ result: 'Fail' });
            }
        });
    } else {
        res.send({ result: 'None' });
    }
});

// 회원가입
app.post('/signUp', (req: { body: { id: any; password: any } }, res: { send: (arg0: { result: string }) => void }) => {
    let id = req.body.id;
    let password = req.body.password;

    if (id && password) {
        db.query('SELECT * FROM usertable WHERE username = ?;', id, (err: any, results: string | any[]) => {
            // 이미 있는 아이디
            if (results.length > 0) {
                res.send({ result: 'Fail' });
            } else {
                // 없을 시 회원가입 완료
                db.query('INSERT INTO usertable (username, password) VALUES(?, ?);', [id, password], (err: any, results: any) => {
                    res.send({ result: 'OK' });
                });
            }
        });
    } else {
        // 아이디 비밀번호 입력하지 않았을 때
        res.send({ result: 'None' });
    }
});

// Users 페이지
// 유저 목록
app.get('/api/users/:userId', (req: { params: { userId: any } }, res: { json: (arg0: { id: string; date: string; friendNum?: number; isFriend?: boolean }[]) => void }) => {
    const userData2: {
        id: string;
        date: string;
        friendNum?: number;
        isFriend?: boolean;
    }[] = [];
    // console.log(req.params);
    // console.log(req.params.userId);

    // 이름, 생성 날짜
    db.query('SELECT username, dateCreated FROM usertable WHERE username != ?;', req.params.userId, (err: any, results: { username: any; dateCreated: string | number | Date }[]) => {
        results.forEach((item: { username: any; dateCreated: string | number | Date }) => {
            const data = {
                id: item.username,
                date: new Date(item.dateCreated).toISOString().substr(0, 10),
            };
            userData2.push(data);
        });
        // console.log(userData2);
    });

    // 친구 수 sql
    const sqlFriendCnt = `SELECT usertable.username, count(friendtable.friendname) AS friendNum
                          FROM usertable
                          JOIN friendtable
                          ON usertable.username = friendtable.username
                          WHERE usertable.username != ?
                          GROUP BY usertable.username;`;

    // 친구 수
    db.query(sqlFriendCnt, req.params.userId, (err: any, results: any[]) => {
        userData2.forEach((item) => {
            let isMatch = false;
            results.forEach((countItem) => {
                if (item.id === countItem.username) {
                    item.friendNum = countItem.friendNum;
                    isMatch = true;
                }
            });
            if (!isMatch) {
                item.friendNum = 0;
            }
        });
        // console.log(userData2);
    });

    // 친구인지 아닌지
    db.query('select * from friendtable where username = ?;', req.params.userId, (err: any, results: any[]) => {
        userData2.forEach((item) => {
            let isMatch = false;
            results.forEach((friendItem) => {
                if (item.id === friendItem.friendname) {
                    item.isFriend = true;
                    isMatch = true;
                }
            });
            if (!isMatch) {
                item.isFriend = false;
            }
        });
        console.log(userData2);
        res.json(userData2);
    });
    // console.log(userData2);
});

// Users 친구 요청
app.get('/api/reqfriends/:userId/:friendId', (req: { params: { userId: any; friendId: any } }, res: { send: (arg0: { result: string }) => void }) => {
    const userId = req.params.userId;
    const friendId = req.params.friendId;
    // console.log(friendId);
    // console.log(userId);

    // // 친구 요청 추가 sql
    const sqlFriendReqAdd = 'INSERT INTO friendrequests VALUES (?, ?);';

    db.query(sqlFriendReqAdd, [friendId, userId], (err: any, results: any) => {
        console.log('친구 요청 목록에서  %s에게 요청 추가', friendId);
        res.send({ result: 'OK' });
    });
});

// Friends페이지

// Friends-수신함 친구 요청 목록
app.get('/api/reqfriends/:userId', (req: { params: { userId: any } }, res: { json: (arg0: { id: string; date: string }[]) => void }) => {
    const reqFriendsData2: {
        id: string;
        date: string;
    }[] = [];
    // console.log('/api/reqfriends/:userId', req.params);
    const userId = req.params.userId;
    // console.log(userId);
    // 수신함 친구 요청 sql
    const reqFriendsSql = `SELECT usertable.username, usertable.dateCreated
                       FROM friendrequests
                       JOIN usertable
                       ON friendrequests.friendname = usertable.username
                       WHERE friendrequests.username = ?;`;

    db.query(reqFriendsSql, userId, (err: any, results: any[]) => {
        // console.log(results);
        results.forEach((item) => {
            const data = {
                id: item.username,
                date: new Date(item.dateCreated).toISOString().substr(0, 10),
            };
            reqFriendsData2.push(data);
        });
        // console.log(reqFriendsData2);
        res.json(reqFriendsData2);
    });
    // res.json(reqFriendsData);
    // console.log(reqFriendsData);
});

// Friends-수신함 친구 승낙
app.get('/api/acceptfriends/:userId/:friendId', (req: { params: { userId: any; friendId: any } }, res: { send: (arg0: { result: string }) => void }) => {
    const userId = req.params.userId;
    const reqFriendId = req.params.friendId;
    // console.log(reqFriendId, userId);

    // 친구 요청 삭제 sql
    const delReqFriend = 'DELETE from friendrequests WHERE username = ? and friendname = ?;';

    // 친구 요청 목록 db에서 삭제
    db.query(delReqFriend, [userId, reqFriendId], (err: any, results: any) => {
        console.log('친구 요청 목록에서 %s의 요청 삭제', reqFriendId);
    });

    //  친구 추가 sql
    const sqlFriendAdd = 'INSERT INTO friendtable VALUES (?, ?), (?, ?);';

    db.query(sqlFriendAdd, [reqFriendId, userId, userId, reqFriendId], (err: any, results: any) => {
        console.log('친구 목록에 %s 추가', reqFriendId);
        res.send({ result: 'OK' });
    });

    // res.send({ result: 'OK' });
});

// Friends-수신함 친구 거절
app.get('/api/rejectfriends/:userId/:friendId', (req: { params: { userId: any; friendId: any } }, res: { send: (arg0: { result: string }) => void }) => {
    // console.log(req.params);
    const userId = req.params.userId;
    const reqFriendId = req.params.friendId;

    // 친구 요청 삭제 sql
    const delReqFriend = 'DELETE from friendrequests WHERE username = ? and friendname = ?;';

    // 친구 요청 목록 db에서 삭제
    db.query(delReqFriend, [userId, reqFriendId], (err: any, results: any) => {
        console.log('친구 요청 목록에서 %s의 요청 삭제', reqFriendId);
        res.send({ result: 'OK' });
    });
});

// Friends-목록 친구 목록
app.get('/api/friends/:userId', (req: { params: { userId: any } }, res: { json: (arg0: { id: string; date: string }[]) => void }) => {
    const friendsData2: {
        id: string;
        date: string;
    }[] = [];

    const userId = req.params.userId;

    // Friends-목록 친구 목록
    const selFriends = `SELECT friendtable.friendname, usertable.dateCreated
                        FROM friendtable
                        JOIN usertable
                        ON friendtable.username = usertable.username
                        WHERE friendtable.username = ?;`;

    // console.log('/api/friendsData/:userId', req.params);
    db.query(selFriends, userId, (err: any, results: any[]) => {
        // console.log(results);
        results.forEach((item) => {
            const data = {
                id: item.friendname,
                date: new Date(item.dateCreated).toISOString().substr(0, 10),
            };
            friendsData2.push(data);
        });
        // console.log(friendsData2);
        res.json(friendsData2);
    });
});

// 친구 삭제
app.get('/api/deleteFriends/:userId/:friendId', (req: { params: { userId: any; friendId: any } }, res: { send: (arg0: { result: string }) => void }) => {
    const userId = req.params.userId;
    const delFriendId = req.params.friendId;
    // console.log(userId, delFriendId);

    // 친구 목록에서 삭제 sql
    const delFriend = 'DELETE from friendtable WHERE username = ? and friendname = ?;';
    const delFriend2 = 'DELETE from friendtable WHERE friendname = ? and username = ?;';

    // 친구 목록 db에서 삭제
    db.query(delFriend, [userId, delFriendId], (err: any, results: any) => {
        db.query(delFriend2, [userId, delFriendId], (err: any, results: any) => {
            console.log('서로의 친구 목록에서 %s와 %s 삭제', userId, delFriendId);
            res.send({ result: 'OK' });
        });
        // console.log('서로의 친구 목록에서 %s 삭제', delFriendId);
        // res.send({ result: 'OK' });
    });
});

app.get('/api/rooms', (req: any, res: { json: (arg0: { members: string[]; id: string }[]) => void }) => {
    res.json(roomData);
});

// socket 통신
io.on('connection', (socket: any) => {
    // console.log('a user connected : ', socket.id);
    socket.on('chatting', (data: any, room: any) => {
        // console.log(`data: ${data.name} ${data.msg},  room: ${room}`);
        socket.to(room).emit('chatting', data);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // 방 입장
    socket.on('join-room', (id: string, room: string) => {
        roomData[Number(room) - 1].members.push(id);
        // console.log(`${id} join room ${room}`);
        socket.join(room);
        socket.to(room).emit('chatting', {
            name: id,
            msg: '님이 입장',
        });

        socket.to(room).emit('newmember-join', room, roomData);
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room: any) =>
            socket.to(room).emit({
                name: 'unknown',
                msg: '님의 연결이 해제되었습니다.',
            })
        );
    });

    // 방 퇴장
    socket.on('leave-room', (id: string, room: string) => {
        roomData[Number(room) - 1].members = roomData[Number(room) - 1].members.filter((element) => element !== id);

        // console.log(`${id} leave rooom ${room}`);
        socket.to(room).emit('chatting', {
            name: id,
            msg: '님이 퇴장',
        });

        socket.to(room).emit('newmember-join', room, roomData);

        socket.leave(room);
    });
});

server.listen(PORT, () => console.log(`server is running ${PORT}`));
