import { Component, CORE_DIRECTIVES, EventEmitter } from 'angular2/angular2';
import { ROUTER_DIRECTIVES, Router } from 'angular2/router';
import { Modal } from '../../../components/modal/modal';
import { SessionFactory } from '../../../services/session';
import { BoostFullNetwork } from '../boost/full-network/full-network';


@Component({
  selector: 'm-modal-boost',
  inputs: [ 'open', 'object' ],
  outputs: ['closed'],
  directives: [ CORE_DIRECTIVES, ROUTER_DIRECTIVES, Modal, BoostFullNetwork ],
  template: `
    <m-modal [open]="open" (closed)="close($event)">
      <minds-boost-full-network [object]="object" (done)="done()"></minds-boost-full-network>
    </m-modal>
  `
})

export class BoostModal {

  open : boolean = false;
  closed : EventEmitter<any> = new EventEmitter();
  object;

  session = SessionFactory.build();



}
