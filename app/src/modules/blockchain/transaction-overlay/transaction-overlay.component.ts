import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, HostListener,
  OnInit
} from '@angular/core';

import { TransactionOverlayService } from './transaction-overlay.service';

declare const Eth;
declare const ethAccount;

@Component({
  moduleId: module.id,
  selector: 'm--blockchain--transaction-overlay',
  templateUrl: 'transaction-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionOverlayComponent implements OnInit {
  @HostBinding('hidden') _isHidden: boolean = true;

  message: string = '';
  comp: number;

  minds: Minds = window.Minds;

  data: { unlock, tx } = {
    unlock: {
      privateKey: '',
      secureMode: true
    },
    tx: { }
  };

  droppingKeyFile: boolean = false;

  protected eventEmitter: EventEmitter<any> = new EventEmitter();

  readonly COMP_METAMASK = 1;
  readonly COMP_LOCAL = 2;
  readonly COMP_UNLOCK = 3;

  constructor(protected service: TransactionOverlayService, protected cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.service.setComponent(this);
  }

  get isHidden() {
    return this._isHidden;
  }

  show(comp: number, message: string = '', defaultTxObject: Object = null): EventEmitter<any> {
    this.message = message;
    this.comp = comp;
    this.reset();
    this.setTx(defaultTxObject);
    this.droppingKeyFile = false;
    this._isHidden = false;

    this.detectChanges();

    return this.eventEmitter;
  }

  hide() {
    this.message = '';
    this.comp = void 0;
    this.reset();
    this.droppingKeyFile = false;
    this._isHidden = true;

    this.detectChanges();
  }

  reset() {
    this.data = {
      unlock: {
        privateKey: '',
        secureMode: true
      },
      tx: { }
    };
  }

  setTx(tx: Object) {
    if (!tx) {
      this.data.tx = {};
      return;
    }

    this.data.tx = Object.assign({}, tx);

    if (typeof this.data.tx.gasPrice !== 'undefined') {
      this.data.tx.gasPrice = Eth.fromWei(this.data.tx.gasPrice, 'Gwei');
    }

    if (typeof this.data.tx.gas === 'undefined') {
      this.data.tx.gas = 0;
    }
  }

  getTx() {
    if (!this.data.tx) {
      return {};
    }

    let tx = Object.assign({}, this.data.tx);

    tx.gasPrice = Eth.toWei(tx.gasPrice, 'Gwei');

    return tx;
  }

  //

  validateUnlock() {
    if (!this.data.unlock.privateKey) {
      return false;
    }

    try {
      let privateKey = this.data.unlock.privateKey;

      if (privateKey.substr(0, 2) !== '0x') {
        privateKey = `0x${privateKey}`;
      }

      ethAccount.privateToAccount(privateKey);
    } catch (e) {
      return false;
    }

    return true;
  }

  unlock() {
    if (!this.validateUnlock()) {
      return;
    }

    let privateKey = this.data.unlock.privateKey;

    if (privateKey.substr(0, 2) !== '0x') {
      privateKey = `0x${privateKey}`;
    }

    this.eventEmitter.next({
      privateKey,
      secureMode: this.data.unlock.secureMode
    });

    this.hide();
  }

  @HostListener('dragover', ['$event'])
  keyDragOver(e: any) {
    if (this.comp !== this.COMP_UNLOCK) {
      return;
    }

    e.preventDefault();
    this.droppingKeyFile = true;
  }

  @HostListener('dragleave', ['$event'])
  keyDragLeave(e: any) {
    if (this.comp !== this.COMP_UNLOCK) {
      return;
    }

    e.preventDefault();

    if (e.layerX < 0) {
      this.droppingKeyFile = false;
    }
  }

  @HostListener('drop', ['$event'])
  keyDropFile(e: any) {
    if (this.comp !== this.COMP_UNLOCK) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    this.droppingKeyFile = false;

    const transfer = (e.dataTransfer || (<any>e).originalEvent.dataTransfer);

    if (!transfer) {
      console.warn('no transfer object');
      return;
    }

    const file = transfer.files[0];

    if (!file) {
      console.warn('file cannot be read');
      return;
    }

    switch (file.type) {
      case 'text/csv':
        // MetaMask
        this.loadKeyFromCSV(file);
        break;

      case 'application/json':
      case '':
        // Keystore JSON
        this.loadKeyFromJSON(file);
        break;
    }
  }

  loadKeyFromCSV(file: File) {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      let privateKey = e.target.result.trim();

      try {
        if (privateKey.substr(0, 2) !== '0x') {
          privateKey = `0x${privateKey}`;
        }

        if (ethAccount.privateToAccount(privateKey)) {
          this.data.unlock.privateKey = privateKey;
          this.detectChanges();
        }
      } catch (e) { }
    };

    reader.readAsText(file);
  }

  loadKeyFromJSON(file: File) {
    throw new Error('Not implemented');
  }

  //

  validateTxObject() {
    return this.data.tx && this.data.tx.gasPrice && this.data.tx.gas && this.data.tx.from;
  }

  approve() {
    if (!this.validateTxObject()) {
      return;
    }

    this.eventEmitter.next(this.getTx());

    this.hide();
  }

  //

  cancel() {
    this.eventEmitter.next(false);
    this.hide();
  }

  //

  detectChanges() {
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
}
