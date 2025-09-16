import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-edit-user-dialog',
  standalone: false,
  templateUrl: './edit-user-dialog.html',
  styleUrl: './edit-user-dialog.css'
})
export class EditUserDialog {
username: string;
  password: string;
  comments: string;
  constructor(
    public dialogRef: MatDialogRef<EditUserDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.username = data.username;
    this.password = data.password;
    this.comments = data.comments;
  }
  save() {
    const updatedData = {
      username: this.username,
      password: this.password,
      comments: this.comments
    };
    this.dialogRef.close(updatedData);
  }

  cancel() {
    this.dialogRef.close();
  }
}
