"""Acrescenta ao AndroidManifest as permissoes de localizacao, notificacao e alarme exato."""
p='android/app/src/main/AndroidManifest.xml'
s=open(p).read()
perms=['android.permission.ACCESS_FINE_LOCATION','android.permission.ACCESS_COARSE_LOCATION','android.permission.POST_NOTIFICATIONS',
       'android.permission.USE_EXACT_ALARM','android.permission.RECEIVE_BOOT_COMPLETED','android.permission.WAKE_LOCK','android.permission.VIBRATE']
add=''.join(f'\n    <uses-permission android:name="{x}" />' for x in perms if x not in s)
add+='\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32" />' if 'SCHEDULE_EXACT_ALARM' not in s else ''
add+='\n    <uses-feature android:name="android.hardware.location.gps" android:required="false" />'
s=s.replace('</manifest>',add+'\n</manifest>')
open(p,'w').write(s); print(s[-900:])
