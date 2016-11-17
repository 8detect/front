import {Title} from '@angular/platform-browser';

export class MindsTitle {

  default_title = " | Minds";
  title = new Title();

  constructor(){}

  setTitle(value : string){
    if (value){
      this.title.setTitle(value + this.default_title);
    }
    else this.title.setTitle(this.default_title);
  }

  static _() {
    return new MindsTitle();
  }
}
