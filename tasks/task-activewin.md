# 📋 task-activewin.md — Task Definitions for onodecli activewin

---

## **prompt user:**

**Bổ sung arg:** `` onodecli activewin --openurl=`https://github.com/login` --hwnd=`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` ``

`--hwnd`=đường dẫn tới browser

`--openurl` = url cần mở

**Flow hoạt động :**

- **nhận đúng 2 thông tin đó, có đầy đủ thì thực hiện tiếp, không thì báo lên cảnh báo cấu hình sai.**
- Dùng `hwnd ` để tìm đúng các process có đúng đường dẫn đó, và trong đó có --user-data-dir và email của profile đó (ví dụ: "C:\\Program Files\\BraveSoftware\\Brave-Browser-Nightly\\Application\\brave.exe" --type=renderer --user-data-dir="F:\\[Browsers\\Brave-Nightly\\dtolaptrinh891@gmail.com](mailto:Browsers\Brave-Nightly\dtolaptrinh891@gmail.com)" )
- Nếu có các process đó, thì distinct theo đường dẫn và email profile, rồi thực hiện chạy lệnh để mở url đến các browser đang mở đó
- Nếu `--openurl có nhiều url, cách nhau bằng dấu || thì split rồi mở nhiều url`
