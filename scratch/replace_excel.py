import openpyxl

wb = openpyxl.load_workbook('data.xlsx')
sheet = wb.active
found = False

for row in sheet.iter_rows():
    for cell in row:
        if cell.value and isinstance(cell.value, str):
            if 'tech diagnostics' in cell.value:
                print('Found string in cell', cell.coordinate)
                print('Old value:', cell.value)
                cell.value = cell.value.replace(
                    'I am M. Mukid Hasan Seiam. With over 8 years in tech diagnostics, I solve complex problems and am currently exploring the world of open-source game development.',
                    'With over 8 years in tech diagnostics, I solve and learn complex problems and i am currently exploring the world of open-source softwares,  2d games  development via a.i. tools.'
                )
                print('New value:', cell.value)
                found = True

if found:
    wb.save('data.xlsx')
    print('Successfully saved data.xlsx')
else:
    print('String not found in data.xlsx')
