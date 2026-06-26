import { getLoginId } from './Login';

const FriendPages: { [key: string]: string } = {
    inbox: 'pages/inbox.html',
    friends: 'pages/Friends_list.html',
};

async function getReqDataFromServer() {
    const userId = getLoginId();
    const url = `/api/reqfriends/${userId}`;
    const data = await fetch(url);
    const userData: {
        id: string;
        date: string;
    }[] = await data.json();
    // console.log(userData);

    const inboxElement: HTMLDivElement | null = document.querySelector('.inbox');
    if (!inboxElement) return;
    inboxElement.innerHTML = '';
    userData.forEach((user) => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend';

        // username
        const userName = document.createElement('div');
        userName.className = 'username';
        userName.innerHTML = `ID : ${user.id}`;
        friendElement.append(userName);

        // signup-date
        const signupDate = document.createElement('div');
        signupDate.className = 'signup-date';
        signupDate.innerHTML = `가입날짜 : ${user.date}`;
        friendElement.append(signupDate);

        // accpet
        const accept = document.createElement('div');
        accept.className = 'accept';
        accept.id = user.id;
        accept.innerHTML = `수락`;
        friendElement.append(accept);
        accept.addEventListener('click', async (e: any) => {
            const friendId: string = e.target.id;
            const data = await fetch(`/api/acceptfriends/${userId}/${friendId}`);
            const userData = await data.json();
            if (userData.result === 'OK') {
                alert('친구등록이 완료되었습니다');
                await getReqDataFromServer();
            }
        });

        // reject
        const reject = document.createElement('div');
        reject.className = 'reject';
        reject.id = user.id;
        reject.innerHTML = `거절`;
        reject.addEventListener('click', async (e: any) => {
            const friendId = e.target.id;
            const data = await fetch(`/api/rejectfriends/${userId}/${friendId}`);
            const userData = await data.json();
            if (userData.result === 'OK') {
                alert('친구 요청을 거절하였습니다.');
                await getReqDataFromServer();
            }
        });
        friendElement.append(reject);

        inboxElement.append(friendElement);
    });
}

async function getMyFriendsDataFromServer() {
    const userId = getLoginId();
    const url = `/api/friends/${userId}`;
    const data = await fetch(url);
    const userData: {
        id: string;
        date: string;
    }[] = await data.json();
    // console.log(userData);

    const friendsElement: HTMLDivElement | null = document.querySelector('.friends');
    if (!friendsElement) return;
    friendsElement.innerHTML = '';
    userData.forEach((user) => {
        const friendElement: HTMLElement = document.createElement('div');
        friendElement.className = 'friend';

        // username
        const userName = document.createElement('div');
        userName.className = 'username';
        userName.innerHTML = `ID : ${user.id}`;
        friendElement.append(userName);

        // signup-date
        const signupDate = document.createElement('div');
        signupDate.className = 'signup-date';
        signupDate.innerHTML = `가입날짜 : ${user.date}`;
        friendElement.append(signupDate);

        // friend-delete
        const deleteElement = document.createElement('div');
        deleteElement.className = 'friend-delete';
        deleteElement.id = user.id;
        deleteElement.innerHTML = `친구삭제`;
        friendElement.append(deleteElement);
        deleteElement.addEventListener('click', async (e: any) => {
            const friendId = e.target.id;
            const data = await fetch(`/api/deletefriends/${userId}/${friendId}`);
            const userData = await data.json();
            if (userData.result === 'OK') {
                alert('친구삭제가 완료되었습니다');
                await getMyFriendsDataFromServer();
            }
        });

        // direct-message
        const dmElement = document.createElement('div');
        dmElement.className = 'direct-message';
        dmElement.id = user.id;
        dmElement.innerHTML = `DM`;
        dmElement.addEventListener('click', async (e) => {
            alert('DM 생성');
        });
        friendElement.append(dmElement);

        friendsElement.append(friendElement);
    });
}

export async function friendsInit() {
    const friendsMain: HTMLElement | null = document.querySelector('.friends_main');
    const nav2: HTMLElement | null = document.querySelector('.nav2');
    await getReqDataFromServer();

    // Friends화면에서 click마다 nav화면전환
    if (!nav2) return;
    nav2.addEventListener('click', async (e: any) => {
        // console.log(e.target);
        const data = await fetch(FriendPages[e.target.id]);
        const html = await data.text();
        if (!friendsMain) return;
        friendsMain.innerHTML = html;
        if (e.target.id === 'inbox') {
            await getReqDataFromServer();
        } else {
            await getMyFriendsDataFromServer();
        }
        // console.log(html);
    });
}
