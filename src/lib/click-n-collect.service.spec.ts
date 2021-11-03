import { TestBed } from '@angular/core/testing';

import { ClickNCollectService } from './click-n-collect.service';

describe('ClickNCollectService', () => {
  let service: ClickNCollectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClickNCollectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
