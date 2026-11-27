import base64,json
ui=open('ui_app.html').read(); core=open('core.js').read()
b64=lambda p:base64.b64encode(open(p,'rb').read()).decode()
F=json.load(open('../fonts/fonts.json'))
out=ui.replace('/*PERFIL*/',open('perfil.js').read()).replace('/*CAMPO*/',open('campo.js').read()).replace('/*CORE*/',core).replace('/*TIMBRE*/',b64('../timbre.png')).replace('/*TJPG*/',b64('timbre.jpg')).replace('/*FONTES*/',json.dumps(F)).replace('/*LOGO*/',b64('logo_app.png')).replace('/*BANDA*/',b64('band_app.png'))
open('/home/claude/teste-bombeamento-mg/www/index.html','w').write(out); print(len(out))
