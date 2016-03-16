import { Component, EventEmitter } from 'angular2/core';
import { CORE_DIRECTIVES, FORM_DIRECTIVES } from 'angular2/common';
import { ROUTER_DIRECTIVES } from 'angular2/router';

import { Client, Upload } from '../../../services/api';
import { MDL_DIRECTIVES } from '../../../directives/material';
import { AutoGrow } from '../../../directives/autogrow';
import { InfiniteScroll } from '../../../directives/infinite-scroll';
import { MindsActivityObject } from '../../../interfaces/entities';
import { SessionFactory } from '../../../services/session';


@Component({
  selector: 'minds-newsfeed-poster',
  inputs: [ '_container_guid: containerGuid', 'accessId'],
  outputs: ['load'],
  templateUrl: 'src/controllers/newsfeed/poster/poster.html',
  directives: [ MDL_DIRECTIVES, CORE_DIRECTIVES, FORM_DIRECTIVES, ROUTER_DIRECTIVES, AutoGrow, InfiniteScroll ]
})

export class Poster {

  session = SessionFactory.build();
  minds;
  type = {
    isVideo : false,
    mimeType : ""
  }
  load: EventEmitter<any> = new EventEmitter();
  inProgress : boolean = false;

  attachment_preview;
  attachment_progress : number = 0;
  attachment_mime : string;
  canPost : boolean = true;

  postMeta : any = {
    title: "",
    description: "",
    thumbnail: "",
    url: "",
    active: false,
    attachment_guid: null,
    container_guid: 0,
    access_id: 2
  }

	constructor(public client: Client, public upload: Upload){
    this.minds = window.Minds;
	}

  set _container_guid(value : any){
    this.postMeta.container_guid = value;
  }

  set accessId(value : any){
    this.postMeta.access_id = value;
  }

	/**
	 * Post to the newsfeed
	 */
	post(){

    if(!this.postMeta.message && !this.postMeta.attachment_guid)
      return;

		var self = this;
    this.inProgress = true;
    this.client.post('api/v1/newsfeed', this.postMeta)
      .then((data : any) => {
        data.activity.boostToggle = true;
  			self.load.next(data.activity);
        //reset
        self.postMeta = {
          message: "",
          title: "",
          description: "",
          thumbnail: "",
          url: "",
          active: false,
          attachment_guid: null,
          container_guid: self.postMeta.container_guid
        }
        self.attachment_preview = null;
        self.attachment_progress = 0;
        this.inProgress = false;
  		})
  		.catch(function(e){
  			self.inProgress = false;
  		});
	}

  uploadAttachment(){
    var self = this;
    var file : any = document.getElementById("file");
    this.canPost = false;
    this.attachment_progress = 0;
    this.attachment_mime = "";

    var fileInfo = file ? file.files[0] : null;

    if(!fileInfo){
      this.canPost = true;
      return;
    }

    /**
     * Give a live preview
     */
    this.checkVideoType(fileInfo.type);

    var reader  = new FileReader();
    reader.onloadend = () => {
      this.attachment_preview = reader.result;
    }
    reader.readAsDataURL(fileInfo);

    /**
     * Upload to the archive and return the attachment guid
     */
    this.upload.post('api/v1/archive', [fileInfo], this.postMeta, (progress) => { this.attachment_progress = progress; })
      .then((response : any) => {
        this.postMeta.attachment_guid = response.guid;
        file.files = [];
        this.canPost = true;
        file.value = null;
      })
      .catch((e) => {
        self.postMeta.attachment_guid = null;
        file.files = [];
        this.canPost = true;
        this.attachment_progress = 0;
        this.attachment_preview = null;
        file.value = null;
      });

  }

  removeAttachment(){
    var self = this;
    var file : any = document.getElementById("file");
    file.value = "";

    this.attachment_preview = null;
    this.client.delete('api/v1/archive/' + this.postMeta.attachment_guid)
      .then((response) => {
        self.postMeta.attachment_guid = null;
      });
    this.canPost = true;
    this.attachment_progress = 0;
  }

  /**
   * Get rich embed data
   */
  timeout;
  getPostPreview(message){
    var self = this;

    var match = message.value.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig);
		if (!match) return;
    var url;

		if ( match instanceof Array) {
			url = match[0];
		} else {
			url = match;
		}

		if (!url.length) return;

		//url = url.replace("http://", '');
		//url = url.replace("https://", '');
    console.log('found url was ' + url)

    self.postMeta.active = true;

    if(this.timeout)
      clearTimeout(this.timeout);

    this.timeout = setTimeout(()=>{
      this.client.get('api/v1/newsfeed/preview', {url: url})
        .then((data : any) => {
          console.log(data);
          self.postMeta.title = data.meta.title;
          self.postMeta.url = data.meta.canonical;
          self.postMeta.description = data.meta.description;
          for (var link of data.links) {
              if (link.rel.indexOf('thumbnail') > -1) {
                  self.postMeta.thumbnail = link.href;
              }
          }
        });
    }, 600);
  }

  checkVideoType(mimeType) {
    if (mimeType.startsWith("video")){
      this.attachment_mime = "video";
    }
  }

}
