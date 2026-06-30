import { getLoginId } from './Login';
import { io } from 'socket.io-client';

interface IroomData {
    members: string[];
    id: string;
}

const socket = io();
let loginId: string;
let serverRoomNumber: string;

// enter눌렀을 때 메세지 보내기
function sendEnter(id: string, roomNumber: string) {
    const chatInput: HTMLInputElement | null = document.querySelector('.chat-input');
    if (!chatInput) return;
    chatInput.addEventListener('keypress', (e: any) => {
        if (e.keyCode === 13) {
            send(id, roomNumber);
        }
    });
}

// 채팅방 참여인원 수
async function roomPeople(): Promise<IroomData[]> {
    let data: IroomData[] = [];
    await fetch('/api/rooms')
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
        })
        .then((text) => {
            // console.log(text);
            data = text;
        });
    return data;
}

// 채팅방 현재인원, 방번호
function makeCurrentMember(id: string, roomData: IroomData[]) {
    // console.log(roomData);
    const roomNumber: HTMLElement | null = document.querySelector('#room-number');
    const currentMember: HTMLElement | null = document.querySelector('#current-member');
    const currentMemberName: HTMLElement | null = document.querySelector('.current-membername');
    const foundElement:
        | {
              members: string[];
              id: string;
          }
        | undefined = roomData.find((item: any) => item.id === id);
    // console.log(foundElement);
    if (!currentMemberName) return;
    if (!currentMember) return;
    if (!roomNumber) return;
    if (!foundElement) return;
    currentMemberName.innerHTML = ''; // 참여 목록 초기화
    if (foundElement.members.length > 0) {
        foundElement?.members.forEach((member) => {
            const user = document.createElement(`li`);
            user.innerHTML = member;
            currentMemberName.appendChild(user);
        });
    }
    currentMember.innerHTML = foundElement.members.length.toString();
    roomNumber.innerHTML = id;
}

function makeRoom(element: IroomData) {
    const room: HTMLElement | null = document.querySelector(`#room${element.id}`);
    if (!room) return;
    room.innerHTML = element.members.length.toString();
}

// 채팅방 입장
export async function roomEnter() {
    const roomDetail: HTMLElement | null = document.querySelector('.rooms-detail');
    const chatInput: HTMLElement | null = document.querySelector('.chat-input');
    const roomExit: HTMLElement | null = document.querySelector('.exit');
    const currentMemberName: HTMLElement | null = document.querySelector('.current-membername');
    const roomMain: HTMLElement | null = document.querySelector('.rooms-main');
    const chatList: HTMLElement | null = document.querySelector('.chatting-list');

    if (!chatInput || !roomExit || !roomMain || !roomDetail || !currentMemberName || !chatList) return;
    chatInput.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) {
            send(loginId, serverRoomNumber);
        }
    });

    // 채팅방 나가기

    roomExit.addEventListener('click', async (e) => {
        socket.emit('leave-room', loginId, serverRoomNumber);
        roomMain.style.display = 'block';
        roomDetail.style.display = 'none';
        currentMemberName.innerHTML = '';
        chatList.innerHTML = '';
        currentMemberName.innerHTML = '';
    });

    roomDetail.style.display = 'none'; // Rooms클릭시 채팅방 안보이기
    const roomData = await roomPeople();
    roomData.forEach((element) => {
        makeRoom(element);
    });
    const enters = document.querySelectorAll('.enter');
    // console.log(enters);
    enters.forEach((enter) => {
        // console.log('addEventListener to enter button');
        // console.log(enter);
        enter.addEventListener('click', async (e: any) => {
            // console.log(e.target.id);
            loginId = getLoginId();
            serverRoomNumber = e.target.id;
            makeCurrentMember(serverRoomNumber, roomData);
            roomMain.style.display = 'none';
            roomDetail.style.display = 'flex';
            // console.log(e.target.id);
            // socket.connect();
            socket.emit('join-room', loginId, serverRoomNumber);

            // sendEnter(getLoginId(), roomNumber);
        });
    });
}

// message 보내기
function send(id: string, roomNumber: string) {
    const chatInput: HTMLInputElement | null = document.querySelector('.chat-input');
    const chat: HTMLInputElement | null = document.querySelector('.chat');
    if (!chat) return;

    if (!chatInput) return;
    const param: {
        name: string;
        msg: string;
    } = {
        name: id,
        msg: chatInput.value,
    };

    // console.log(param.name, param.msg);

    makeChatlist(param.name, param.msg); // LiModel 인스턴스화
    chat.scrollTo(0, chat.scrollHeight);
    socket.emit('chatting', param, roomNumber);
    chatInput.value = '';
}

// 채팅
socket.on('chatting', (data) => {
    const chat: HTMLInputElement | null = document.querySelector('.chat');
    if (!chat) return;
    const { name, msg } = data;
    // console.log(name, msg);
    makeChatlist(name, msg); // LiModel 인스턴스화
    chat.scrollTo(0, chat.scrollHeight);
});

// 채팅방 내 유저목록
socket.on('refresh-member', (id, roomData) => {
    makeCurrentMember(id, roomData);
});

function makeChatlist(name: string, msg: string): void {
    const chatList: HTMLElement | null = document.querySelector('.chatting-list');
    if (!chatList) return;

    const li = document.createElement('li');
    // li.classList.add(id.value === this.name ? "sent" : "received");
    li.classList.add();
    const dom = `
         <span class="profile">
            <span class="chat-user">${name} : </span>
         </span>
         <span class="message">${msg}</span>
      `;
    li.innerHTML = dom;
    chatList.appendChild(li);
}
