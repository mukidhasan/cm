Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("thumbnail.png")
$newImg = New-Object System.Drawing.Bitmap(1200, 630)
$g = [System.Drawing.Graphics]::FromImage($newImg)
$g.DrawImage($img, 0, 0, 1200, 630)
$newImg.Save("thumbnail.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose()
$newImg.Dispose()
$img.Dispose()
