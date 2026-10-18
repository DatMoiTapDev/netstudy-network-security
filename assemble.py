import json,pathlib,hashlib,random
root=pathlib.Path(__file__).parent
chapters=[]
for suffix in ['a','b','c']: chapters+=json.loads((root/f'content-{suffix}.json').read_text(encoding="utf-8"))
order=['1','2a','2b','3','4','5','6','7','8'];chapters.sort(key=lambda c:order.index(c['id']))
assert [c['id'] for c in chapters]==order
remaps={
 '8':dict(zip(['8.'+str(i) for i in range(1,13)],['8.1','8.2.1','8.2.2','8.2.3','8.2.4','8.2.5','8.2.6','8.3','8.4','8.5','8.6','8.7'])),
 '1':{'1.1':'1.1',**{f'1.{i}':f'1.2.{i-1}' for i in range(2,8)},'1.8':'1.3','1.9':'1.4','1.10':'1.5'},
 '2a':dict(zip(['2a.'+str(i) for i in range(1,11)],['2a.1','2a.2','2a.3.1','2a.3.2','2a.3.3','2a.4','2a.5.1','2a.5.2','2a.6','2a.7'])),
 '2b':dict(zip(['2b.'+str(i) for i in range(1,13)],['2b.1.1','2b.1.2','2b.1.3','2b.2.1','2b.2.2','2b.2.3','2b.2.4','2b.3','2b.4.1','2b.4.2','2b.4.3','2b.5']))}
outlines={
 '1':['Một số khái niệm','Các kỹ thuật tấn công phổ biến và cơ chế phòng thủ','Lý lịch của những kẻ tấn công','Mô hình bảo mật cơ bản','Bài tập'],
 '2a':['Lịch sử hình thành Trojan','Khái niệm về Trojan','Phân loại Trojan','Một số Trojan phổ biến','Phòng chống Trojan','Một số cổng đi cùng các Trojan thông dụng','Bài tập'],
 '2b':['Tổng quan về Virus máy tính','Các kỹ thuật của Virus máy tính','Các kỹ thuật của Virus máy tính trên mạng','Phòng chống Virus máy tính','Một số bài tập'],
 '3':['Giới thiệu về mật mã hoá','Lịch sử của mật mã','Giải thuật mã hoá cổ điển','Giải thuật mã hoá hiện đại','Bẻ gãy một hệ thống mật mã','Bài tập'],
 '4':['Số nguyên tố','Hệ mã hoá khoá công khai','Giao thức trao đổi khoá Diffie-Hellman','Hệ RSA','Quản lý khoá','Bài tập'],
 '5':['Mở đầu','Mã chứng thực thông điệp','Hàm băm','Chữ ký số','Bài tập'],
 '6':['Vị trí của mật mã trong mạng máy tính','Cơ sở hạ tầng khoá công khai','IPsec','SSL/TLS','PGP và S/MIME','Kerberos','SSH','Bài tập'],
 '7':['Tổng quan','Phân loại','Các kiểu chứng thực','WEP, WPA và WPA2','Các mối đe doạ','Phương pháp tấn công','Công cụ tấn công','Tấn công mạng Bluetooth','Biện pháp phòng chống','Công cụ bảo mật Wi-Fi','Kiểm thử hệ thống'],
 '8':['Tổng quan','Cơ bản về tường lửa','NAT (Chuyển dịch địa chỉ mạng)','DMZ (Demilitarized Zone)','TMG (Threat Management Gateway)','Tường lửa ngày nay','Bài tập']}
for c in chapters:
 c['outline']=outlines[c['id']]
 remap=remaps.get(c['id'],{})
 for section in c['sections']:section['id']=remap.get(str(section['id']),str(section['id']))
 for q in c['questions']:
  q['section']=remap.get(str(q['section']),str(q['section']))
  order_options=list(range(4));random.Random(hashlib.sha256(q['id'].encode()).hexdigest()).shuffle(order_options)
  q['options']=[q['options'][i] for i in order_options]
  q['explanations']=[q['explanations'][i] for i in order_options]
  q['correct']=order_options.index(q['correct'])
 supplemental={
 '5':[{'title':'NIST — Chính sách về hàm băm','url':'https://csrc.nist.gov/projects/hash-functions/nist-policy-on-hash-functions','note':'Đối chiếu mở rộng: SHA-1 không phù hợp để tạo chữ ký số cần chống va chạm; học cơ chế lịch sử không đồng nghĩa chọn thuật toán này cho hệ thống mới.'}],
 '6':[{'title':'RFC 9846 — TLS 1.3','url':'https://www.rfc-editor.org/info/rfc9846/','note':'Đối chiếu mở rộng: tài liệu TLS 1.3 cập nhật năm 2026 thay RFC 8446, vẫn giữ số phiên bản 1.3. Phần SSL/TLS trong slide cần đọc theo phiên bản được mô tả.'},{'title':'RFC 8429 — 3DES và RC4 trong Kerberos','url':'https://www.rfc-editor.org/rfc/rfc8429.html','note':'Đối chiếu mở rộng: 3DES và RC4 bị loại dần trong Kerberos; đây là ghi chú phân biệt cơ chế lịch sử với triển khai thực tế.'}]}
 c['external']=supplemental.get(c['id'],[])
(root/'dist/data.js').write_text('window.COURSE='+json.dumps(chapters,ensure_ascii=False)+';\nwindow.SOURCE_PAGES='+(root/'source-pages.json').read_text(encoding="utf-8")+';\n',encoding='utf-8')
print(json.dumps({'chapters':len(chapters),'sections':sum(len(c['sections']) for c in chapters),'questions':sum(len(c['questions']) for c in chapters)},ensure_ascii=False))
