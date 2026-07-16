import openpyxl

wb = openpyxl.load_workbook('c:/Users/Saaqib/Documents/GitHub/cm/data.xlsx')
ws = wb.active

for row in ws.iter_rows(min_row=2):
    key = row[0].value
    if key == 'content_c3_tag':
        row[1].value = 'মিডিয়া'
        row[2].value = 'Media'
    elif key == 'content_c3_title':
        row[1].value = 'সোশ্যাল মিডিয়া কার্যক্রম'
        row[2].value = 'Social Media Activities'
    elif key == 'content_c3_desc':
        row[1].value = 'সোশ্যাল মিডিয়া কার্যক্রম এবং কন্টেন্ট'
        row[2].value = 'Social media activities and content.'

wb.save('c:/Users/Saaqib/Documents/GitHub/cm/data.xlsx')
print("Successfully updated data.xlsx")
