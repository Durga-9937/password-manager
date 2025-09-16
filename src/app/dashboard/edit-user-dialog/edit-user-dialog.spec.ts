import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditUserDialog } from './edit-user-dialog';

describe('EditUserDialog', () => {
  let component: EditUserDialog;
  let fixture: ComponentFixture<EditUserDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditUserDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditUserDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
