# สมาชิกกลุ่ม

นายบุญยศักดิ์ รัตนดิลก ณ ภูเก็ต 67102010165

อนันฌานนทน์ แป้นสุวรรณ 67102010176

นายสิทธิโชติ เกรียงชัยพฤกษ์ 67102010224

# pinme

## **1) ที่มาของปัญหาและความสำคัญ**

ในชีวิตประจำวัน ผู้ใช้มักต้องการค้นหาสถานที่ใกล้ตัวภายในระยะที่กำหนด เช่น ร้านอาหาร โรงแรม สนามกีฬา หรือสถานที่ท่องเที่ยว แต่การค้นหาผ่านหลายแพลตฟอร์มทำให้ข้อมูลกระจัดกระจาย ใช้เวลาในการเปรียบเทียบ และไม่สะดวกในการจัดหมวดหมู่เพื่อเลือกสถานที่ที่เหมาะสม

นอกจากนี้ เมื่อผู้ใช้ต้องการไปหลายสถานที่ในวันเดียว ยังขาดเครื่องมือที่ช่วย **จัดแผนแบบเป็นระบบ** เช่น การเรียงลำดับกิจกรรมและกำหนดช่วงเวลา ซึ่งทำให้แผนเดินทางสับสนและเกิดเวลาทับซ้อนกันได้ง่าย

ดังนั้น โครงงานนี้จึงมีความสำคัญในการพัฒนาระบบที่ช่วยให้ผู้ใช้สามารถ **สแกนสถานที่ใกล้เคียงตามรัศมี**, **จัดหมวดหมู่**, และ **วางแผนทริป 1 วัน** ได้อย่างเป็นระบบในแพลตฟอร์มเดียว

---

## **2) จุดประสงค์ของโครงงาน และประโยชน์ที่คาดว่าจะได้รับ**

### **จุดประสงค์ของโครงงาน (แก้ปัญหาอะไร)**
- พัฒนาระบบสำหรับค้นหาสถานที่ใกล้เคียงจากจุดตั้งต้นและระยะทางที่กำหนด พร้อมแยกหมวดหมู่สถานที่  
- เพิ่มฟังก์ชันการกรองและเรียงลำดับเพื่อช่วยให้ผู้ใช้ตัดสินใจได้เร็วขึ้น  
- พัฒนา **Mini Trip Planner (1 วัน)** เพื่อช่วยผู้ใช้เลือกหลายสถานที่และกำหนดช่วงเวลา โดยระบบตรวจสอบการทับซ้อนของเวลา  
- ฝึกกระบวนการพัฒนาซอฟต์แวร์ตามหลัก **Software Engineering (SDLC)** รวมถึงการออกแบบ การทดสอบ การวัดผล และการบริหารโครงงาน  

### **ประโยชน์ที่คาดว่าจะได้รับ**
- ผู้ใช้ค้นหาสถานที่ในรัศมีที่ต้องการได้รวดเร็วและเป็นหมวดหมู่  
- ลดเวลาการหาข้อมูลและการจัดแผนเดินทาง  
- ผู้ใช้สามารถวางแผนทริป 1 วันได้ชัดเจน ลดปัญหาเวลาทับซ้อน  
- ทีมพัฒนาได้ฝึกการทำงานแบบเป็นระบบ ใช้เครื่องมือ DevOps และสร้างเอกสารตามมาตรฐาน  

---

## **3) ขอบเขตของโครงงาน (Scope)**

### **สิ่งที่ทำ (In Scope)**
- ผู้ใช้เลือกจุดตั้งต้น (สถานที่/พิกัด) และกำหนดรัศมีค้นหา (กิโลเมตร)  
- ระบบสแกนและแสดงรายการสถานที่ใกล้เคียงภายในรัศมีที่กำหนด  
- แยกหมวดหมู่สถานที่: โรงแรม / ร้านอาหาร / สนามกีฬา / สถานที่ท่องเที่ยว  
- กรองและเรียงผลลัพธ์ (เช่น เรียงตามระยะใกล้สุด)  
- แสดงหน้ารายละเอียดสถานที่ (ชื่อ หมวดหมู่ ระยะทาง และปุ่มเปิดแผนที่)  
- ผู้ใช้สามารถบันทึกสถานที่ที่สนใจ (Bookmark)  
- **Mini Trip Planner (1 วัน):** เลือกหลายสถานที่ กำหนดเวลา แสดงเป็น timeline/ปฏิทิน และตรวจสอบเวลาทับซ้อน  

### **สิ่งที่ไม่ทำ (Out of Scope)**
- ไม่ทำการคำนวณเส้นทางที่ดีที่สุด (Route Optimization)  
- ไม่ทำระบบจองหรือชำระเงินจริง  
- ไม่ทำระบบรีวิวขั้นสูงหรือโซเชียลฟีด  
- ไม่ใช้ AI เพื่อแนะนำสถานที่ (ใช้การกรองและจัดหมวดหมู่ตามกฎ)  

---

## **4) Functional & Non-Functional Requirements**

### **4.1 Functional Requirements (FR)**
- **FR-01** ผู้ใช้สามารถเลือกจุดตั้งต้นและกำหนดรัศมีค้นหาได้  
- **FR-02** ระบบสามารถค้นหาและแสดงสถานที่ภายในรัศมีที่กำหนดได้  
- **FR-03** ระบบสามารถแยกผลลัพธ์ตามหมวดหมู่ (โรงแรม/ร้านอาหาร/สนามกีฬา/ท่องเที่ยว) ได้  
- **FR-04** ผู้ใช้สามารถกรองและเรียงผลลัพธ์ตามระยะทางได้  
- **FR-05** ผู้ใช้สามารถดูรายละเอียดสถานที่และเปิดดูตำแหน่งบนแผนที่ได้  
- **FR-06** ผู้ใช้สามารถบันทึก (Bookmark) และยกเลิก Bookmark ได้  
- **FR-07** ผู้ใช้สามารถสร้างทริป 1 วัน โดยเลือกหลายสถานที่ได้  
- **FR-08** ผู้ใช้สามารถกำหนดเวลาเริ่มต้น–สิ้นสุดของแต่ละสถานที่ในทริปได้  
- **FR-09** ระบบต้องตรวจสอบและแจ้งเตือนเมื่อเวลาของกิจกรรมในทริปทับซ้อนกัน  
- **FR-10** ระบบสามารถแสดงทริปเป็น timeline หรือปฏิทินรายวันได้  

### **4.2 Non-Functional Requirements (NFR)**
- **NFR-01 Usability:** ผู้ใช้สามารถสแกนสถานที่ได้ภายในไม่เกิน 3–4 ขั้นตอน  
- **NFR-02 Performance:** แสดงผลการสแกนภายใน 2 วินาที เมื่อจำนวนข้อมูลอยู่ในขอบเขตที่กำหนด  
- **NFR-03 Accuracy:** การคำนวณระยะทางต้องถูกต้องตามสูตรที่ใช้ (เช่น Haversine Formula)  
- **NFR-04 Reliability:** ผลลัพธ์ต้องสม่ำเสมอเมื่อใช้ input เดิม และการตรวจสอบเวลาทับซ้อนต้องเชื่อถือได้  
- **NFR-05 Maintainability:** โครงสร้างระบบแยกโมดูล (Scan / Filter / Trip / Bookmark) เพื่อให้แก้ไขและต่อยอดได้ง่าย  
- **NFR-06 Compatibility:** ระบบสามารถใช้งานผ่านเว็บเบราว์เซอร์ทั่วไปได้  

## 5) กระบวนการทำงาน (Process, Methods, and Tools)
Process (แนวทางพัฒนา)

ใช้กระบวนการพัฒนาแบบ Incremental + Iterative แบ่งงานเป็นรอบ (Sprint/Phase)

Phase 1: เก็บ requirement, user stories, scope, FR/NFR

Phase 2: ออกแบบระบบ (Architecture + Use Case) ออกแบบ UI ด้วย Figma และสร้างเว็บอย่างน้อย 2 หน้า พร้อม endpoint ประมวลผล input

Phase 3: พัฒนาเว็บเกือบสมบูรณ์ เพิ่ม unit tests ให้ครอบคลุม data structure 100% และเก็บค่า profiling baseline

Phase 4: พัฒนาเว็บสมบูรณ์ เพิ่ม UI tests, ทำ CI/CD และเปรียบเทียบผล profiling กับ Phase 3

### Methods (วิธีทำงาน)

Requirement elicitation & refinement

User stories และ acceptance criteria

Sprint planning และการติดตามงาน

Retrospective เพื่อปรับปรุงการทำงานในแต่ละ phase

### Tools (เครื่องมือที่ใช้)

Azure DevOps Boards: จัดการ Product และ Sprint Backlog

Azure Repos (Git): Version control, branch และ pull request

Figma: ออกแบบ UI และใช้ screenshot ประกอบรายงาน

Mermaid: สร้าง Use Case และ Architecture Diagram

Testing tools: เช่น Jest/Supertest สำหรับ unit test และ coverage

Profiling tools: เก็บข้อมูล static และ dynamic profiling

CI/CD Pipeline: ใช้ pipeline script ที่อาจารย์กำหนด

Communication: LINE/Discord, Zoom/Teams และ YouTube สำหรับ retrospective
---

## **6) Use Case Diagram**



```mermaid
flowchart TB
  user([User])

  uc1((Select location & radius))
  uc2((Scan nearby places))
  uc3((Filter & sort results))
  uc4((View place detail))
  uc5((Bookmark place))
  uc6((Create 1-day trip plan))
  uc7((Set time for each activity))
  uc8((Validate time conflict))
  uc9((View trip as timeline/calendar))

  user --> uc1
  user --> uc2
  user --> uc3
  user --> uc4
  user --> uc5
  user --> uc6
  user --> uc7
  user --> uc8
  user --> uc9
```



## 7) process, methods, and tools 

1) Process (กระบวนการทำงาน)
  
ทีมงานใช้การพัฒนาแบบ Incremental + Iterative คือทำงานทีละส่วน และปรับปรุงแก้ไขไปเรื่อย ๆ โดยมีขั้นตอนหลักดังนี้
- Phase 1: เก็บและวิเคราะห์ Requirement ของระบบ กำหนดขอบเขตโครงงาน และสรุปฟังก์ชันที่ต้องทำ
- Phase 2: ออกแบบระบบและหน้าจอการใช้งาน โดยใช้ Figma ช่วยออกแบบ UI และสร้าง Website เบื้องต้น
- Phase 3: พัฒนา Website ให้เกือบสมบูรณ์ เพิ่มการทดสอบระบบ และตรวจสอบประสิทธิภาพของโปรแกรม
- Phase 4: ปรับปรุง Website ให้สมบูรณ์ เพิ่มการทดสอบเพิ่มเติม และทำระบบ CI/CD
- การทำงานเป็นรอบ ๆ ช่วยให้สามารถตรวจสอบงานและแก้ไขปัญหาได้ตลอดการพัฒนา

2) Methods (วิธีการทำงาน)

ในการทำงาน ทีมใช้วิธีการดังนี้
- พูดคุยและสรุป requirement ร่วมกัน
- แบ่งงานตามความถนัดของสมาชิกในทีม
- วางแผนงานในแต่ละช่วง และติดตามความคืบหน้า
- ประชุมสรุปผลและทำ Retrospective หลังจบแต่ละ Phase
- จากการทำ Retrospective พบว่าช่วงแรกทีมมีความเข้าใจในขอบเขตโครงงานไม่ตรงกัน จึงแก้ไขโดยการสร้าง Prototype เพื่อช่วยให้เห็นภาพระบบชัดเจนมากขึ้น และทำให้ทุกคนเข้าใจตรงกัน

3) Tools (เครื่องมือที่ใช้)

ทีมงานใช้เครื่องมือต่าง ๆ เพื่อช่วยในการพัฒนาโครงงาน ได้แก่
- Azure DevOps Boards สำหรับจัดการงานและติดตามความคืบหน้า
- Azure Repos (Git) สำหรับเก็บและจัดการซอร์สโค้ด
- Figma สำหรับออกแบบหน้าจอการใช้งาน
- Mermaid สำหรับสร้างแผนภาพ Use Case
- เครื่องมือทดสอบ สำหรับตรวจสอบความถูกต้องของระบบ
- LINE / Discord / Zoom สำหรับการสื่อสารและประชุมทีม

## 8) Summary Requirement

[Requirement Video](https://youtu.be/yf1TyKvzm6Q)

-  หลังจากที่ได้อธิบายรายละเอียดของโปรเจกต์ให้กับกลุ่มอื่นรับฟัง ก็ได้รับผลตอบรับที่ดี และในส่วนของ requirement ก็ไม่มีประเด็นปัญหาที่ต้องแก้ไขมากนัก

ส่วนของ requirement 
1) เลือกจุดตั้งต้น
2) กำหนดระยะทาง
3) ค้นหาสถานที่ใกล้เคียง
4) แยกหมวดหมู่สถานที่
5) กรองและเรียงลำดับผลลัพธ์
6) แสดงรายละเอียดสถานที่
7) บันทึกสถานที่ที่สนใจ
8) สร้างแผนการเดินทาง 1 วัน
9) กำหนดช่วงเวลาในแผนการเดินทาง
10) ตรวจสอบความซ้ำซ้อนของเวลา
  
## 9) Summary Retrospective

[Retrospective Video](https://youtu.be/FMwXFTwsZNE)

-  ปัญหาเริ่มมาจากการมองภาพของ Project นี้และ Scope ไม่ตรงกัน ทำให้เกิดปัญหาความขัดแย้ง ดังนั้นจึงแก้ปัญหาด้วยการสร้าง Prototype เพื่อปรับความเข้าใจกันทำให้มุมมองตรงกันและช่วยกันแก้ไขจนได้ Version ในปัจจุบัน และอีกปัญหาคือการไม่คุ้นชินกับเครื่องมือที่ใช้เกี่ยวกับการทำงาน

## 10) Product backlog

![Product Backlog](sprint_1.png)

![Product Backlog](product_backlog1.png)

![Product Backlog](product_backlog2.png)

![Product Backlog](product_backlog3.png)

---

## 11) Sprint backlog

![Sprint Backlog](milestone_sprint_1-4.png)

---

### sprint 1 (Due Feb 5th)

เป้าหมาย

- เพื่อวิเคราะห์ความต้องการของระบบและจัดทำเอกสารที่เกี่ยวข้องก่อนเริ่มพัฒนาระบบจริง

Issue ที่อยู่ใน Sprint 1 :

- ทำ Report และกำหนด Requirement

 ![Sprint Backlog](sprint_1.png)

---
## 12) New functional/non-functional requirement
### Functional Requirements (FR)**
- **FR-01** ผู้ใช้สามารถเลือกจุดตั้งต้นและกำหนดรัศมีค้นหาได้  
- **FR-02** ระบบสามารถค้นหาและแสดงสถานที่ภายในรัศมีที่กำหนดได้  
- **FR-03** ระบบสามารถแยกผลลัพธ์ตามหมวดหมู่ (โรงแรม/ร้านอาหาร/สนามกีฬา/ท่องเที่ยว) ได้  
- **FR-04** ผู้ใช้สามารถกรองและเรียงผลลัพธ์ตามระยะทางได้  
- **FR-05** ผู้ใช้สามารถดูรายละเอียดสถานที่และเปิดดูตำแหน่งบนแผนที่ได้  
- **FR-06** ผู้ใช้สามารถบันทึก (Bookmark) และยกเลิก Bookmark ได้  
- **FR-07** ผู้ใช้สามารถสร้างทริป 1 วัน โดยเลือกหลายสถานที่ได้  
- **FR-08** ผู้ใช้สามารถกำหนดเวลาเริ่มต้น–สิ้นสุดของแต่ละสถานที่ในทริปได้  
- **FR-09** ระบบต้องตรวจสอบและแจ้งเตือนเมื่อเวลาของกิจกรรมในทริปทับซ้อนกัน  
- **FR-10** ระบบสามารถแสดงทริปเป็น timeline หรือปฏิทินรายวันได้
### Non-Functional Requirements (NFR)**
- **NFR-01 Usability:** ผู้ใช้สามารถสแกนสถานที่ได้ภายในไม่เกิน 3–4 ขั้นตอน  
- **NFR-02 Performance:** แสดงผลการสแกนภายใน 2 วินาที เมื่อจำนวนข้อมูลอยู่ในขอบเขตที่กำหนด  
- **NFR-03 Accuracy:** การคำนวณระยะทางต้องถูกต้องตามสูตรที่ใช้ (เช่น Haversine Formula)  
- **NFR-04 Reliability:** ผลลัพธ์ต้องสม่ำเสมอเมื่อใช้ input เดิม และการตรวจสอบเวลาทับซ้อนต้องเชื่อถือได้  
- **NFR-05 Maintainability:** โครงสร้างระบบแยกโมดูล (Scan / Filter / Trip / Bookmark) เพื่อให้แก้ไขและต่อยอดได้ง่าย  
- **NFR-06 Compatibility:** ระบบสามารถใช้งานผ่านเว็บเบราว์เซอร์ทั่วไปได้
## 13) Architectural design
```mermaid
flowchart LR
    User[User Browser]

    subgraph Frontend
        UI[Web UI]
        Map[Map Component]
    end

    subgraph Backend
        API[REST API Server]
        Scan[Scan Service]
        Trip[Trip Planner Service]
        Bookmark[Bookmark Service]
        Filter[Filter & Sort Engine]
    end

    subgraph Data
        DB[(Database)]
        Geo[(Location/Geo Data)]
    end

    User --> UI
    UI --> API
    Map --> API

    API --> Scan
    API --> Trip
    API --> Bookmark
    API --> Filter

    Scan --> Geo
    Filter --> Geo

    Trip --> DB
    Bookmark --> DB
```
Use Case Diagram

Actors
 • User (ผู้ใช้งานทั่วไป)

Mermaid: Use Case Diagram 
```mermaid
flowchart TB
  user([User])

  uc1((Select location & radius))
  uc2((Scan nearby places))
  uc3((Filter & sort results))
  uc4((View place detail))
  uc5((Pin/Unpin place))
  uc6((View pinned places))
  uc7((Create 1-day trip))
  uc8((Set time for trip activities))
  uc9((Validate time conflicts))
  uc10((View trip timeline/calendar))

  user --> uc1
  user --> uc2
  user --> uc3
  user --> uc4
  user --> uc5
  user --> uc6
  user --> uc7
  user --> uc8
  user --> uc9
  user --> uc10
```

Other Designs (Optional but Recommended)

A) Sequence Diagram: Nearby Scan
```mermaid
sequenceDiagram
  actor User
  participant UI as Web UI
  participant API as Backend API
  participant S as Scan Service
  participant DB as Database

  User->>UI: Enter location/radius/categories
  UI->>API: POST /scan (input)
  API->>S: scanNearby(input)
  S->>DB: query places (by category)
  DB-->>S: places list
  S-->>API: filtered/sorted/grouped results
  API-->>UI: results
  UI-->>User: show categorized place cards
```
B) Sequence Diagram: Trip Validate (กันเวลาทับซ้อน)
```mermaid
sequenceDiagram
  actor User
  participant UI as Web UI
  participant API as Backend API
  participant T as Trip Planner Service
  participant DB as Database

  User->>UI: Set start/end time for activities
  UI->>API: POST /trip/validate (events)
  API->>T: validate(events)
  T->>T: check time overlaps
  alt conflict found
    T-->>API: invalid + conflict details
    API-->>UI: show warning message
  else no conflict
    T->>DB: save events
    DB-->>T: ok
    T-->>API: valid
    API-->>UI: show success + timeline/calendar
  end
```

C) Activity Diagram: Trip Planner Flow
```mermaid
flowchart TD
  A[Start] --> B[Select places]
  B --> C[Set start/end time]
  C --> D[Validate time conflicts]
  D -->|Conflict| E[Show warning and adjust time]
  E --> C
  D -->|No conflict| F[Save trip events]
  F --> G[Display timeline/calendar]
  G --> H[End]
```
## 14) Website screenshot

### Page 1
![Page 1](Website_Screenshot_Figma/page1.png)

### Page 2
![Page 2](Website_Screenshot_Figma/page2.png)

### Page 3
![Page 3](Website_Screenshot_Figma/page3.png)

### Page 4
![Page 4](Website_Screenshot_Figma/page4.png)

### Page 5
![Page 5](Website_Screenshot_Figma/page5.png)

### page 6
![Page 6](Website_Screenshot_Figma/scan_result1.png)

### page 7
![Page 7](Website_Screenshot_Figma/scan_result2.png)

## System Workflow

### 1)Scan (การค้นหาสถานที่ใกล้เคียง)

#### ขั้นตอนที่ 1: ผู้ใช้กำหนดข้อมูล
ผู้ใช้กรอกข้อมูลดังต่อไปนี้:
- ตำแหน่งเริ่มต้น (Location)
- ระยะทางที่ต้องการค้นหา (เช่น 1, 3, 5 กิโลเมตร)
- หมวดหมู่ที่สนใจ (Hotel / Restaurant / Sport / Tourist)

#### ขั้นตอนที่ 2: ระบบประมวลผล
ระบบจะดำเนินการดังนี้:
- รับค่าพิกัด (Latitude, Longitude)
- คำนวณระยะทางระหว่างจุดตั้งต้นกับสถานที่ในฐานข้อมูล
- กรองเฉพาะสถานที่ที่อยู่ภายในรัศมีที่กำหนด
- แยกผลลัพธ์ตามหมวดหมู่
- เรียงลำดับตามระยะทาง (หากผู้ใช้เลือก)

#### ขั้นตอนที่ 3: แสดงผลลัพธ์
ระบบจะแสดง:
- รายชื่อสถานที่
- หมวดหมู่
- ระยะทางจากจุดตั้งต้น
- ปุ่ม View Detail และ Pin

---

### 2) Place Detail (ดูรายละเอียดสถานที่)

เมื่อผู้ใช้กดดูรายละเอียด:

ระบบจะ:
- ดึงข้อมูลสถานที่จากฐานข้อมูล
- แสดงชื่อ หมวดหมู่ ที่อยู่ และระยะทาง
- แสดงตำแหน่งบนแผนที่ (Map Preview)

ผู้ใช้สามารถ:
- ปักหมุด (Pin)
- เพิ่มสถานที่ลงในทริป

---

### 3) Pin / Bookmark (การปักหมุด)

เมื่อผู้ใช้กดปักหมุด:

- ระบบบันทึกข้อมูลลงในตาราง bookmarks
- ผู้ใช้สามารถดูรายการสถานที่ที่ปักหมุดไว้ในหน้า My Pins
- สามารถลบออกจากรายการ หรือเพิ่มเข้า Trip Planner

---

### 4) Mini Trip Planner (การสร้างทริป 1 วัน)

#### ขั้นตอนที่ 1: เลือกสถานที่
ผู้ใช้สามารถเลือกหลายสถานที่จาก:
- ผลการค้นหา
- รายการที่ปักหมุด

#### ขั้นตอนที่ 2: กำหนดเวลา
ผู้ใช้กำหนด:
- เวลาเริ่มต้น (Start Time)
- เวลาสิ้นสุด (End Time)

#### ขั้นตอนที่ 3: ระบบตรวจสอบความถูกต้อง
ระบบจะ:
- ตรวจสอบว่าช่วงเวลาของกิจกรรมทับซ้อนกันหรือไม่
- หากมีการทับซ้อน → แสดงข้อความแจ้งเตือน
- หากไม่มีการทับซ้อน → บันทึกข้อมูลลงฐานข้อมูล

#### ขั้นตอนที่ 4: แสดงผลแบบ Timeline
ระบบจะแสดง:
- ลำดับกิจกรรมเรียงตามเวลา
- รูปแบบปฏิทินหรือ Timeline รายวัน

---

## Core Processing Logic

### 1) Distance Calculation
ระบบใช้สูตรคำนวณระยะทางระหว่างพิกัด (เช่น Haversine Formula)  
เพื่อคัดกรองสถานที่ที่อยู่ภายในรัศมีที่กำหนด

---

### 2) Time Conflict Validation
ระบบจะ:
- ตรวจสอบกิจกรรมทั้งหมดภายในทริปเดียวกัน
- เปรียบเทียบช่วงเวลาเริ่มต้นและสิ้นสุด
- หากพบช่วงเวลาทับซ้อนกัน → แสดงข้อความ Error และไม่บันทึกข้อมูล

## Summary Retrospective Phase 2

ใน Phase 2 ได้ออกแบบระบบ (Architecture, Use Case, Workflow) และพัฒนา Prototype ด้วย Figma และเว็บไซต์เบื้องต้น ทำให้เห็นภาพระบบชัดเจนมากขึ้นและลดความคลาดเคลื่อนจาก Phase 1

สิ่งที่ทำได้ดี: มี Prototype ช่วยให้เข้าใจตรงกันมากขึ้น และเริ่มแบ่งงานเป็นระบบ

ปัญหาที่พบ: ยังไม่คุ้นชินกับเครื่องมือบางอย่าง และมีความเข้าใจ flow บางส่วนไม่ตรงกัน

แนวทางปรับปรุง: เพิ่มการสื่อสารระหว่างทีม กำหนดมาตรฐานการทำงานให้ชัดเจน และปรับ Design ให้สอดคล้องกับ Implementation มากขึ้น

[Requirement Video](https://youtu.be/1FdYNd2XVNs)
