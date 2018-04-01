import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';


@Injectable()
export class RoomsProvider {
  token: any;
  url = 'http://localhost:3000/api/home';
  userId: any;
  username: any;

  constructor(
    private http: HttpClient,
    private storage: Storage,
  ) {
   
  }

  getRooms(): Observable<any> {
    let headers = new HttpHeaders();
    this.loadData();
    headers.append('Authorization', this.token);

    return this.http.get(this.url, {headers: headers});
  }

  getUser(): Observable<any>{
    this.getDataFromToken();

    return this.http
      .get(`http://localhost:3000/api/user/${this.username}`); 
  }

  postData(sender?, receiver?, senderId?): Observable<any> {
    return this.http
        .post(`http://localhost:3000/api/user/${this.username}`, {
          sender: sender,
          receiver: receiver,
          senderId: senderId
        });
  }

  postNewData(sendername?, senderId?, receivername?, receiverId?): Observable<any> {
    return this.http
        .post(`http://localhost:3000/api/user/${this.username}`, {
          receiver_name: receivername,
          receiver_Id: receiverId,
          sender_name: sendername,
          sender_Id: senderId
        });
  }

  returnUser(user): Observable<any>{
    return this.http.get(`http://localhost:3000/api/user/${user.replace(/ /g, '-')}`);
  }

  acceptRequest(sender, receiver, senderId?, receiverId?): Observable<any> {
    return this.http
        .post(`http://localhost:3000/api/user/${this.username}`, {
          senderName: sender,
          receiverName: receiver,
          senderid: senderId,
          receiverid: receiverId
        });
  }

  cancelRequest(sender, receiver): Observable<any> {
    return this.http
        .post(`http://localhost:3000/api/user/${this.username}`, {
          sendername: sender,
          receivername: receiver
        });
  }

  addFavorite(id, room, user): Observable<any> {
    return this.http
        .post('http://localhost:3000/api/home', {
          id: id,
          roomName: room,
          user: user
        });
  }

  searchRoom(room): Observable<any> {
    return this.http
        .post(`http://localhost:3000/api/search-room`, {
          room: room
        })
  }

  addRoom(name, country): Observable<any> {
    return this.http
        .post(`http://localhost:3000/api/add-room`, {
          room: name,
          country: country
        });
  }

  blockUser(user1, user2): Observable<any> {
    return this.http
      .post(`http://localhost:3000/api/block-user`, {
        user1: user1,
        user2: user2
      });
  }

  unblockUser(user1, user2): Observable<any> {
    return this.http
      .post(`http://localhost:3000/api/unblock-user`, {
        user1: user1,
        user2: user2
      });
  }

  loadData() {
    this.storage.get("token").then(value => {
      this.token = value;
    })
  }

  getDataFromToken() {
    this.storage.get("token").then(token => {
      let payload;
      if (token) {
        payload = token.split('.')[1];
        payload = window.atob(payload);
        this.username = JSON.parse(payload).data.username;
      }
    })
  }

}
