import { TestBed } from '@angular/core/testing';

import { ClickNCollectService } from './clickNCollect.service';

describe('ClickNCollectService', () => {
  let service: ClickNCollectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClickNCollectService);
  });

  it('should be get storeList', () => {
    service.getStoreList();
    expect(service.stores).not.toBe([]);
  });

  it('should get nearby stores', () => {
    service.storesNearBy();
    expect(service.storesNearBy).not.toBe([]);
  });

  it('should get distance of stores', () => {
    service.find_closest_marker(service.currentLocation.lat, service.currentLocation.lng);
    expect(service.distanceInKm).not.toBe([]);
  });


});
