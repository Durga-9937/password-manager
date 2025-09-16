import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Generate } from './generate';

describe('Generate', () => {
  let component: Generate;
  let fixture: ComponentFixture<Generate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Generate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Generate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
