import url from 'url';
import passportJwt, { StrategyOptions } from 'passport-jwt';
import { Strategy as PassportStrategy } from 'passport-strategy';
import payload, { Payload } from 'payload';
import { Request } from 'express';
import { SanitizedConfig } from 'payload/config';

const JwtStrategy = passportJwt.Strategy;

const getExtractJWT = (config: SanitizedConfig) => (req: Request): string | null => {
    if (req && req.get) {
      const jwtFromHeader = req.get('Authorization');
      const origin = req.get('Origin');
  
      if (jwtFromHeader && jwtFromHeader.indexOf('JWT ') === 0) {
        return jwtFromHeader.replace('JWT ', '');
      }

    return null;
  };
}

export function PlayerJWTStrategy ({ secret, config, collections }: Payload): PassportStrategy  {
    
  const opts: StrategyOptions = {
    passReqToCallback: true,
    jwtFromRequest: getExtractJWT(config),
    secretOrKey: secret,
  };

  return new JwtStrategy(opts, async (req, token, done) => {
    if (req.user) {
      done(null, req.user);
    }

    try {
      const collection = collections[token.collection];

      const parsedURL = url.parse(req.url);
      const isGraphQL = parsedURL.pathname === config.routes.graphQL;

      const user = await payload.findByID({
        id: token.id,
        collection: collection.config.slug,
        req,
        overrideAccess: true,
        depth: isGraphQL ? 0 : collection.config.auth.depth,
      });

      if (user && (!collection.config.auth.verify || user._verified)) {
        user.collection = collection.config.slug;
        user._strategy = 'local-jwt';
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(null, false);
    }
  });
};