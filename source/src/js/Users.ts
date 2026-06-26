import { getLoginId } from './Login';

async function getDataFromServer() {
    const userId = getLoginId();
    const url = `/api/users/${userId}`;
    const data = await fetch(url);
    const userData = await data.json();
    // console.log(userData);

    const usersElement = document.querySelector('.users');
    userData.forEach((user: { id: string; date: any; friendNum: any; isFriend: any }) => {
        const userElement: HTMLElement = document.createElement('div');
        userElement.className = 'user';

        // username
        const userName: HTMLElement = document.createElement('div');
        userName.className = 'username';
        userName.innerHTML = `ID : ${user.id}`;
        userElement.append(userName);

        // signup-date
        const signupDate: HTMLElement = document.createElement('div');
        signupDate.className = 'signup-date';
        signupDate.innerHTML = `가입날짜 : ${user.date}`;
        userElement.append(signupDate);

        // friend-num
        const friendNum: HTMLElement = document.createElement('div');
        friendNum.className = 'friendNum';
        friendNum.innerHTML = `친구수 : ${user.friendNum}`;
        userElement.append(friendNum);

        // friend-requests
        const friendRequests: HTMLElement = document.createElement('div');
        friendRequests.className = 'friend-requests';
        friendRequests.id = user.id;
        friendRequests.innerHTML = `친구요청`;
        if (user.isFriend) friendRequests.style.visibility = 'hidden';
        userElement.append(friendRequests);
        usersElement.append(userElement);
    });
}

export async function usersInit() {
    await getDataFromServer();
    const userId = getLoginId();
    const friendRequests = document.querySelectorAll('.friend-requests');
    friendRequests.forEach((request) => {
        request.addEventListener('click', async (e: any) => {
            const friendId = e.target.id;
            const data = await fetch(`/api/reqfriends/${userId}/${friendId}`);
            const userData = await data.json();
            if (userData.result === 'OK') {
                alert('요청이 완료되었습니다');
            }
        });
    });
}
