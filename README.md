# practica2_sa
OAuth vs SAML

* [Documento-esayo](oauth_vs_saml.pdf)
* [Presentación](https://docs.google.com/presentation/d/1krT14v0VQyoHcc8YhN3WLfpDh-Adh3j0HzJ6LAzgj0o/edit?usp=sharing)
* [Video](VIDEO)

# Cómo levantar el proyecto

```bash
# 1. Levantar Keycloak + MySQL
docker compose up -d
docker compose logs mysql | grep -i "ready for connections"   # esperá que aparezca 2 veces

# 2. Backend OAuth 2.0 + OIDC (puerto 3000)
cd oauth-oidc-poc
npm install
npm run dev

# 3. Backend SAML 2.0 (puerto 4000, en otra terminal)
cd saml-poc
npm install
npm run dev
```

Probar:
- OAuth/OIDC: `http://localhost:3000/auth/login`
- SAML: `http://localhost:4000/saml/login`
- Usuario de prueba: `luis.demo@example.com` / `Demo1234!`

Reset completo (borra datos):
```bash
docker compose down -v
```
## Certificado del SP (SAML)
 
El POC de SAML necesita su propio par de llaves para firmar los
`AuthnRequest` (Keycloak lo exige vía `WantAuthnRequestsSigned=true`).
 
```bash
cd saml-poc/keys
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout privkey.pem -out cert.pem -days 3650 \
  -subj "/CN=saml-poc-sp/O=CUNOC/C=GT"
```
 
Qué hace cada flag:
- `-x509`: genera un certificado autofirmado directo (sin pasar por una
  Solicitud de Certificado / CSR intermedia), suficiente para un POC.
- `-newkey rsa:2048`: crea junto con el certificado una llave privada RSA
  nueva de 2048 bits.
- `-nodes`: la llave privada queda **sin passphrase**, necesario porque
  `samlify` la lee directo desde disco sin pedir contraseña en cada arranque.
- `-days 3650`: válido 10 años, para no preocuparse por expiración durante
  el curso.
- `-subj "/CN=saml-poc-sp/O=CUNOC/C=GT"`: datos del certificado (Common
  Name, Organización, País).
