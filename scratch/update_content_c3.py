import openpyxl

wb = openpyxl.load_workbook('c:/Users/Saaqib/Documents/GitHub/cm/data.xlsx')
ws = wb['Translations']

for row in ws.iter_rows(min_row=2):
    key = row[0].value
    if key == 'content_c3_tag':
        row[1].value = 'Media'
        row[2].value = 'মিডিয়া'
    elif key == 'content_c3_title':
        row[1].value = 'Social Media Activities'
        row[2].value = 'সোশ্যাল মিডিয়া কার্যক্রম'
    elif key == 'content_c3_desc':
        row[1].value = 'Social media activities and content.'
        row[2].value = 'সোশ্যাল মিডিয়া কার্যক্রম এবং কন্টেন্ট'

wb.save('c:/Users/Saaqib/Documents/GitHub/cm/data.xlsx')
print("Successfully updated data.xlsx")
