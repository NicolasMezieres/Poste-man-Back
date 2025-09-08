export const inscriptionEmailTemplate = (url: string, username: string) => {
  return `<html>
              <body style="font-family: Arial, sans serif; background-color: #F5F5F5; padding: 30px;">
                <table width="100%" cellpadding="0" border="0" style="max-width: 600px; margin: auto; background-color: #DDD0EE; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 1);">
                <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                  <img src="https://images.unsplash.com/photo-1620656068208-e192263b7c11?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Image avec des enveloppes d'email"
                  style="width: 100%;height: 300px; border-radius: 8px; object-fit: cover;"/>
                </div>
                  <tr>
                  <td style="padding: 30px">
                  <p style="font-size: 32px;">${username}</p>
                    <p style="font-size: 16px; color: #212121; line-height: 1.6;">
                    Pour activer votre compte cliquez <a href="${url}">ici</a>
                    </p>
                    <p style="font-size: 14px; color: #212121">
                    Si vous êtes pas a l'origine de cet email veuillez le l'ignorer.
                    </p>
                    <p style="color: #212121">
                    Cordialement l'équipe de Poste Man
                    </p>
                  </td>
                  </tr>
                </table>
              </body>
          </html>`;
};
export const sendPasswordResetTemplate = (username: string, url: string) => {
  return `<html>
              <body style="font-family: Arial, sans serif; background-color: #F5F5F5; padding: 30px;">
                <table width="100%" cellpadding="0" border="0" style="max-width: 600px; margin: auto; background-color: #DDD0EE; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 1);">
                <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                  <img src="https://images.unsplash.com/photo-1620656068208-e192263b7c11?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Image avec des enveloppes d'email"
                  style="width: 100%;height: 300px; border-radius: 8px; object-fit: cover;"/>
                </div>
                  <tr>
                  <td style="padding: 30px">
                  <p style="font-size: 32px;">${username}</p>
                    <p style="font-size: 16px; color: #212121; line-height: 1.6;">
                    Pour pouvoir reinitaliser votre mot de passe cliquer <a href="${url}">ici</a>
                    </p>
                    <p style="font-size: 14px; color: #212121">
                    Si vous êtes pas a l'origine de cet email veuillez le l'ignorer.
                    </p>
                    <p style="color: #212121">
                    Cordialement l'équipe de Poste Man
                    </p>
                  </td>
                  </tr>
                </table>
              </body>
          </html>`;
};
