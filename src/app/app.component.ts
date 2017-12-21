import { Component } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  appTitle: string = 'Secret Santa';

  private secretSantaCollection: string = 'secret-santas';

  secretSantas: Array<SecretSanta>;
  whosDrawn: Array<SecretSanta>;


  error: string;
  picking: SecretSanta;
  picked: SecretSanta;

  constructor(private db: AngularFirestore) { }

  ngOnInit(): void {
    this.getSecretSantas();
    this.getHasDrawn();
  }

  async getSecretSantas() {
    this.db.collection(this.secretSantaCollection).valueChanges()
      .subscribe((snapshot) => {
        if (snapshot)
          this.secretSantas = (<Array<SecretSanta>>snapshot);
      });
  }

  async getHasDrawn() {
    this.db.collection(this.secretSantaCollection).valueChanges()
      .subscribe((snapshot) => {
        if (snapshot) {
          this.whosDrawn = (<Array<SecretSanta>>snapshot).filter((secretSanta) => {
            return secretSanta.hasPicked;
          })
        }
      })
  }

  getName(name: string) {
    if (name.trim() === '') { this.error = "Please enter your name"; return; }
    let picker;
    this.secretSantas.forEach((secret) => {
      if (secret.name.toLowerCase() === name.toLowerCase()) {
        if (secret.hasPicked) { picker = "picked"; return; }
        picker = secret as SecretSanta;
      }
    });

    if (picker === 'picked') { this.error = "You have already picked :/"; return; }
    if (!picker) { this.error = "Sorry you are not a Secret Santa this year :/"; return; }

    let rand = Math.floor(Math.random() * this.secretSantas.length);
    let secretSantee = this.secretSantas[rand];
    while (secretSantee.name.toLowerCase() === name.toLowerCase() || !secretSantee.available) {
      rand = Math.floor(Math.random() * this.secretSantas.length);
      secretSantee = this.secretSantas[rand];
    }

    let index = 0;
    setInterval(() => {
      if (index >= this.secretSantas.length) index = 0;
      if (!this.picked) {
        this.picking = this.secretSantas[index];
        index++;
      } else {
        this.picking = null;
      }
    }, 300)

    this.error = '';
    setTimeout(() => {
      this.picking = null;
      this.picked = secretSantee;


      this.db.collection(this.secretSantaCollection).doc(picker.name.toLowerCase())
        .update({ hasPicked: true })
        .then(() => {
          this.db.collection(this.secretSantaCollection).doc(secretSantee.name.toLowerCase())
            .update({ available: false, secretSanta: picker.name })
            .then(() => {
              console.log("success");
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
        })


    }, 3000);

  }
}

export interface SecretSanta {
  name: string;
  available: boolean;
  hasPicked: boolean;
  secretSanta: string;
  image?: string;
}