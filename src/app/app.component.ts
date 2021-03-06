import { MessageProvider } from './../providers/message/message';
import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { Nav, Platform, AlertController, MenuController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Events } from 'ionic-angular';
import * as _ from 'lodash';
import { RoomsProvider } from '../providers/rooms/rooms';
import * as io from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { ProfileProvider } from '../providers/profile/profile';
import { NativeStorage } from '@ionic-native/native-storage';
// import { Storage } from '@ionic/storage';


@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnInit, OnDestroy {
  @ViewChild(Nav) nav: Nav;

  rootPage: string;

  public animateVarible:boolean = false;

  roomUsers = [];
  roomData = [];
  username: any;
  userId: any;
  isFriend: any;
  userData: any;
  user: any;
  checkUser = false;

  friends = '';
  notFriends = '';

  countryRoomUsers = [];

  socketHost: any;
  socket: any;

  constructor(
    public platform: Platform, 
    public statusBar: StatusBar, 
    public splashScreen: SplashScreen,
    private events: Events,
    private alertCtrl: AlertController,
    private rm: RoomsProvider,
    private profile: ProfileProvider,
    private http: HttpClient,
    private menuCtrl: MenuController,
    private msg: MessageProvider,
    private nativeStorage: NativeStorage,
    // private storage: Storage,
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    this.events.subscribe('list', (data) => {
      if(data.length > 0){
        this.roomUsers = data;
      }
    });

    this.events.subscribe('roomlist', (data) => {
      if(data.length > 0){
        this.countryRoomUsers = _.uniq(data);
      }
    });
    
  }

  initializeApp() {
    this.socketHost = 'https://soccerchatapi.herokuapp.com';
    
    this.platform.ready().then(() => {
      this.socket = io(this.socketHost)
      this.socket.connect();

      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      // this.statusBar.styleDefault();
      this.statusBar.overlaysWebView(true);
      this.statusBar.backgroundColorByHexString('#4aa1f3');
      this.splashScreen.hide();
      
      this.nativeStorage.getItem('token')
      .then(
        data => {
            if(data){
              let payload = data.split('.')[1];
              payload = window.atob(payload);
              let newValue = JSON.parse(payload).data.username.replace(/ /g, '-');
              this.http
                .get(`https://soccerchatapi.herokuapp.com/api/user/${newValue}`)
                  .subscribe((res: any) => {
                    let params = {
                      room: 'global',
                      user: res
                    }
                    this.socket.emit('online', params);
                  });
              this.nav.setRoot("TabsPage");
            }
        },
        error => {
          this.nav.setRoot("LandPage");
        });

      // this.storage.get('token').then(loggedIn => {
      //   if(loggedIn !== null){
      //     let payload;
      //     if (loggedIn) {
      //       payload = loggedIn.split('.')[1];
      //       payload = window.atob(payload);
      //       let newValue = JSON.parse(payload).data.username.replace(/ /g, '-');
      //       this.http
      //         .get(`https://soccerchatapi.herokuapp.com/api/user/${newValue}`)
      //           .subscribe((res: any) => {
      //             let params = {
      //               room: 'global',
      //               user: res
      //             }
      //             this.socket.emit('online', params);
      //           });
      //           this.nav.setRoot("TabsPage");
      //     }
          
          
      //   } else if(loggedIn === null) {
      //     setTimeout(() => {
      //       this.nav.setRoot("LandPage");
      //     }, 10)
      //   }
      // });

      this.events.subscribe('userName', (data) => {
        this.userId = data.user._id;
        this.username = data.user.username;
        this.userData = data.user;
      });
  
      const params = {
          sender: this.username
      }
      
      this.socket.emit('joinRequest', params, () => {
          
      });
      
    });
  }

  showAlert(user) {
    this.checkUser = this.checkIfFriends2(this.userData.friends, user.name);

    if(this.checkUser === false){
      let alert = this.alertCtrl.create();
      alert.setTitle(`${user.name}`)
      alert.addInput({
        type: "radio",
        label: 'View Profile',
        value: `${user.name}`,
        handler: (data) => {
          this.menuCtrl.close('rightSide');
          alert.dismiss();
          this.profile.getProfile(user.name)
            .subscribe(res => {
              this.nav.push('UserprofilePage', {'profile': res.profile});
            });
        }
      });

      alert.addInput({
        type: "radio",
        label: 'Send Request',
        value: `${user.name}`,
        handler: (data) => {
          this.rm.postData(this.username, user.name, this.userId, 'request')
            .subscribe(res => {
              data.label = 'Friend Request Sent';
              this.socket.emit('refresh', {});
              this.socket.emit('request', {
                sender: this.username,
                receiver: user.name
              });
            })
        }
      });

      alert.addInput({
        type: "radio",
        label: 'Send Message',
        value: `${user.name}`,
        handler: (data) => {
          this.menuCtrl.close('rightSide');
          alert.dismiss();
          this.sendMessage(user.name);
        }
      });

      alert.addButton({
        text: 'cancel'
      });

      alert.present();

    } else {
      let alert = this.alertCtrl.create();
      alert.setTitle(`${user.name}`)
      alert.addInput({
        type: "radio",
        label: 'View Profile',
        value: `${user.name}`,
        handler: (data) => {
          this.menuCtrl.close('rightSide');
          alert.dismiss();
          this.profile.getProfile(user.name)
            .subscribe(res => {
              this.nav.push('UserprofilePage', {'profile': res.profile});
            });
        }
      });

      alert.addInput({
        type: "radio",
        label: 'Send Message',
        value: `${user.name}`,
        handler: (data) => {
          alert.dismiss();
          this.menuCtrl.close('rightSide');
          this.profile.getProfile(user.name)
            .subscribe(res => {
              this.sendMessage(user.name);
            });
        }
      });

      alert.addButton({
        text: 'cancel'
      });

      alert.present()
    }
  }

  displayAlert(user) {
    this.checkUser = this.checkIfFriends2(this.userData.friends, user.name);

    if(this.checkUser === false){
      let alert = this.alertCtrl.create();
      alert.setTitle(`${user.name}`)
      alert.addInput({
        type: "radio",
        label: 'View Profile',
        value: `${user.name}`,
        handler: (data) => {
          this.menuCtrl.close('rightSide');
          alert.dismiss();
          this.profile.getProfile(user.name)
            .subscribe(res => {
              this.nav.push('UserprofilePage', {'profile': res.profile});
            });
        }
      });

      alert.addInput({
        type: "radio",
        label: 'Send Request',
        value: `${user.name}`,
        handler: (data) => {
          this.rm.postData(this.username, user.name, this.userId, 'request')
            .subscribe(res => {
              data.label = 'Friend Request Sent';
              this.socket.emit('refresh', {});
              this.socket.emit('request', {
                sender: this.username,
                receiver: user.name
              });
            })
        }
      });

      alert.addInput({
        type: "radio",
        label: 'Send Message',
        value: `${user.name}`,
        handler: (data) => {
          this.menuCtrl.close('rightSide');
          alert.dismiss();
          this.sendMessage(user.name);
        }
      });

      alert.present();

    } else {
      let alert = this.alertCtrl.create();
      alert.setTitle(`${user.name}`)
      alert.addInput({
        type: "radio",
        label: 'View Profile',
        value: `${user.name}`,
        handler: (data) => {
          this.menuCtrl.close('rightSide');
          alert.dismiss();
          this.profile.getProfile(user.name)
            .subscribe(res => {
              this.nav.push('UserprofilePage', {'profile': res.profile});
            });
        }
      });

      alert.addInput({
        type: "radio",
        label: 'Send Message',
        value: `${user.name}`,
        handler: (data) => {
          alert.dismiss();
          this.menuCtrl.close('rightSide');
          this.profile.getProfile(user.name)
            .subscribe(res => {
              this.sendMessage(user.name);
            });
        }
      });

      alert.present()
    }
  }

  sendMessage(name){
    this.profile.getProfile(name)
      .subscribe(res => {
        this.rm.postNewData(this.username, this.userData._id, name, res.profile._id, 'request')
          .subscribe(res => {});

          let alert = this.alertCtrl.create({
            title: 'Send Message',
            inputs: [
              {
                name: 'message',
                placeholder: 'Message'
              }
            ],
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel'
              },
              {
                text: 'Send Message',
                cssClass: 'alertCss',
                handler: data => {
                  this.socket.emit('privateMessage', name, this.username, {
                    text: data.message,
                    room1: name,
                    room2: this.username,
                    sender: this.username,
                    receiver: name
                  });
              
                  this.socket.emit('refresh', {});
              
                  this.msg.saveMessage(this.userData._id, res.profile._id, this.username, name, data.message)
                    .subscribe(res => {
                      this.socket.emit('refresh', {})
                    });
                }
              }
              
            ],
          });
          alert.present()
      });
  }

  checkIfFriends(arr1, name?){
    let value = false;

    if(arr1.name === name){
      value = true;
      this.friends = 'Friends';
    } else {
      value = false;
    }

    return value
  }

  checkIfFriends2(arr1, name?){
    let value = false;
    if(arr1.length > 0) {
      _.forEach(arr1, val => {
        if(val.name === name){
          value = true;
        } else {
          value = false;
        }
      });
    } 

    return value
  }

  logout() {
    // this.nativeStorage.remove('token');
    this.nav.setRoot("LandPage");
    this.socket.disconnect();
  }

  ngOnDestroy() {
    this.socket.disconnect();
    this.events.unsubscribe("");
  }
}
