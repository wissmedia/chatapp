import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, ModalController, Events, AlertController } from 'ionic-angular';
import * as io from 'socket.io-client';
import { RoomsProvider } from '../../providers/rooms/rooms';
import { CommentProvider } from '../../providers/comment/comment';
import moment from "moment";
import { LocationProvider } from '../../providers/location/location';
import { ProfileProvider } from '../../providers/profile/profile';


@IonicPage()
@Component({
  selector: 'page-stream',
  templateUrl: 'stream.html',
})
export class StreamPage {

  stream: any;
  user: any;
  user2: any;
  streamArray = [];
  topPostArray = [];
  username: any;
  postLength = 0;
  commentLength: any;
  userData: any;

  scrollElement: any;

  socketHost: any;
  socket: any;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private platform: Platform,
    private modalCtrl: ModalController,
    private rm: RoomsProvider,
    private cp: CommentProvider,
    private events: Events,
    private loc: LocationProvider,
    private alertCtrl: AlertController,
    private profile: ProfileProvider
  ) {
    this.stream = "now";
    this.scrollElement = document.querySelector('div.scroll-content');

    this.socketHost = 'https://soccerchatapi.herokuapp.com';
    this.platform.ready().then(() => {
      this.socket = io(this.socketHost);
    });
  }

  ionViewDidLoad() {
    this.getPost();

    this.rm.getUser()
      .subscribe(res => {
        this.userData = res.user;
        let params = {
          room: 'global',
          user: res
        }
        this.socket.emit('online', params);
      });

    this.socket.on('refreshPage', (data) => {
      this.getPost();
    })

    this.socket.on('new stream', (data) => {
      this.user2 = data.user;
      this.streamArray.unshift(data.msg.posts);
    });

    this.socket.on('userOnline', (data) => {
      this.events.publish("onlineUser", data);
    });

  }

  showModal() {
    this.rm.getUser()
      .subscribe(res => {
        let modal = this.modalCtrl.create("StreamModalPage", {"pageuser": res});
        modal.present();
        this.socket.emit('join stream', {"room": "stream"})
      });
  }

  addComment(stream){
    this.rm.getUser()
      .subscribe(res => {
        this.navCtrl.push("CommentsPage", {"sender": res.user, "receiver": this.user[0], 
        "receiver2": this.user2, "posts": stream});

        this.socket.emit('refresh', {});
      });
  }

  likeComment(stream) {
    this.cp.addLike(stream._id)
      .subscribe(res => {
        this.postLength = 1;
      });
      this.socket.emit('refresh', {});
  }

  GetPostTime = (time: number) => {
    return moment(time).fromNow();
  }

  getPost(){
    setTimeout(() => {
      this.cp.getPosts()
        .subscribe(res => {
          if(res.posts.length > 0) {
            this.user = res.posts;
            this.streamArray = res.posts;
          }

          if(res.top.length > 0) {
            
            this.topPostArray = res.top
          }
        });
    }, 3000);
  }

  viewProfile(user){
    let alert = this.alertCtrl.create();
    alert.setTitle(`${user}`)
    alert.addInput({
      type: "radio",
      label: 'View Profile',
      value: `${user}`,
      handler: (data) => {
        this.profile.getProfile(user)
          .subscribe(res => {
            alert.dismiss();
            this.navCtrl.push('UserprofilePage', {'profile': res.profile});
          });
      },
    })

    alert.present()
  }

  ionViewDidEnter(){
    this.loc.getCoordinates()
      .subscribe(res => {
        if(this.userData !== undefined){
          this.loc.addLocation(this.userData._id, res)
            .subscribe(res => {
              //console.log(res);
            });
        }
      });
  }

  numberFormatter(num, digits) {
    var si = [
      { value: 1, symbol: "" },
      { value: 1E3, symbol: "k" },
      { value: 1E6, symbol: "M" },
      { value: 1E9, symbol: "G" },
      { value: 1E12, symbol: "T" },
      { value: 1E15, symbol: "P" },
      { value: 1E18, symbol: "E" }
    ];
    var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var i;
    for (i = si.length - 1; i > 0; i--) {
      if (num >= si[i].value) {
        break;
      }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
  }


}