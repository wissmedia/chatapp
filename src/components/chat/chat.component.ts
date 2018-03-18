import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { RoomsProvider } from '../../providers/rooms/rooms';
import { MessageProvider } from '../../providers/message/message';
import * as io from 'socket.io-client';
import * as _ from 'lodash';
import moment from 'moment';


@Component({
  selector: 'chat-page',
  templateUrl: 'chat.component.html'
})
export class ChatComponent {

  friends: any;
  user: any;
  onlineUser: any;
  inArray = [];

  userName: string;
  userData: any;

  sender: string;
  receiver: string;

  msgArray = [];

  isOnline = []

  socketHost: any;
  socket: any;


  constructor(
    public navCtrl: NavController, 
    private rm: RoomsProvider,
    private platform: Platform,
    private msg: MessageProvider,
  ) {
    this.socketHost = 'https://soccerchatapi.herokuapp.com';
    this.platform.ready().then(() => {
      this.socket = io(this.socketHost);
    });
  }

  ngOnInit(){
    this.rm.getUser()
      .subscribe(res => {
        let params = {
          room: 'global',
          user: res
        }
        this.socket.emit('online', params)
      }); 
    this.getUserData();

    this.socket.on('refreshPage', (data) => {
      this.getUserData()
      this.rm.getUser()
        .subscribe(res => {
          this.msg.getMessage(res.user._id, res.user.username)
            .subscribe(res => {
              this.msgArray = res.arr;
            });
        });
    });
  }

  ngAfterViewInit(){
    this.socket.on('userOnline', (data) => {
      this.isOnline = data;
    });


    this.rm.getUser()
      .subscribe(res => {
        let params = {
          room: 'global',
          user: res
        }
        this.socket.emit('online', params)

        setTimeout(() => {
          this.msg.getMessage(res.user._id, res.user.username)
            .subscribe(res => {
              this.msgArray = res.arr;
            })
        }, 4000);
      }); 
  }

  getUserData(){
    this.rm.getUser()
      .subscribe(res => {
        this.friends = res.user.friends;
        this.user = res.user;
        this.userName = res.user.username;
      });
  }

  PrivateChatPage(friend) {
    this.socket.emit('refresh', {});
    this.navCtrl.push("PrivatechatPage", {"receiver": friend, "sender": this.user})
    this.msg.markMessage(this.userName)
      .subscribe(res => {})
  }

  checkValue(value , arr){
    var status = '';
   
    for(var i=0; i<arr.length; i++){
     var name = arr[i];
     if(name == value){
      status = value;
      break;
     }
    }
  
    return status;
   }

  checkIfBlocked(arr1?, arr2?, name?){
    let value = false;
    if(arr1.length > 0) {
      _.forEach(arr1, val => {
        if(val === name){
          value = false;
        } else {
          value = true;
        }
      });
    } 

    if(arr2.length > 0) {
      _.forEach(arr2, val => {
        if(val === name){
          value = false;
        } else {
          value = true;
        }
      });
    }

    if(arr1.length === 0 && arr2.length === 0) {
      value = true;
    } 
    return value
  }

  GetTime = (time: number) => {
    const todaysDate = new Date();
    const date = new Date(time);

    var a = moment(new Date(todaysDate));
    var b = moment(new Date(date));
    var c = a.diff(b, 'days') 

    if(c === 0){
      return moment(time).format("LT")
    } else {
      return moment(time).format("D/MM/YY")
    }
  
  }

  Increment = (arr, name1, name2) => {
    let total = 0;
    _.forEach(arr, val => {
      if(val.isRead === false && val.sendername === name1 && val.receivername === name2){
        total += 1;
      }
    });
    return total
  }

  messageRead(arr, name1, name2){
    let value = false;
    _.forEach(arr, val => {
      if(val.isRead === true && val.sendername === name2 && val.receivername === name1){
        value = true;
      }
    })

    return value;
  }

}