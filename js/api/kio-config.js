// Mọi tên bảng khai báo tập trung tại đây (không khai báo rải rác trong module).
window.HD_CONFIG={driver:(typeof location!=='undefined'&&new URLSearchParams(location.search).get('driver'))||'local', // 'local' = localStorage | 'kio' = KIO server (mở index.html?driver=kio)
 tables:{contracts:'hd_contracts',customers:'hd_customers'}};
