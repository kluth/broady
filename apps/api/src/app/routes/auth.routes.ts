import { Router, Request, Response } from 'express';
import { FirebaseAdminService } from '../services/firebase.service';

const authRouter = Router();
const firebaseAdmin = FirebaseAdminService.getInstance();

authRouter.post('/sessionLogin', async (req: Request, res: Response) => {
  const idToken = req.body.idToken;

  if (!idToken) {
    return res.status(400).send('No ID token provided.');
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await firebaseAdmin.getAuth().createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn, httpOnly: true, secure: true, sameSite: 'none' as const }; // secure and sameSite for production
    res.cookie('session', sessionCookie, options);
    res.status(200).send({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    res.status(401).send('Unauthorized: Session cookie creation failed.');
  }
});

authRouter.post('/sessionLogout', async (req: Request, res: Response) => {
  res.clearCookie('session');
  res.status(200).send({ status: 'success' });
});

// Middleware to protect routes (example)
export async function authenticateFirebaseToken(req: Request, res: Response, next: () => void) {
  const sessionCookie = req.cookies?.session || ''; // Use req.cookies if cookie-parser is configured

  // Verify the session cookie. In this case, it was previously determined that the session cookie is good.
  try {
    const decodedClaims = await firebaseAdmin.getAuth().verifySessionCookie(sessionCookie, true);
    (req as any).user = decodedClaims; // Attach user claims to request
    next();
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    res.clearCookie('session');
    res.status(403).send('Unauthorized: Invalid session.');
  }
}

export default authRouter;
