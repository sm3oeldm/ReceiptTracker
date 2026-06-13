const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Generate a random 6-character invite code
function generateInviteCode() {
  return crypto.randomBytes(3).toString('uppercase').replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

// Create a new group
router.post('/create', authMiddleware, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  try {
    // Generate a unique invite code
    let inviteCode;
    let codeExists = true;

    while (codeExists) {
      inviteCode = generateInviteCode();
      const { data, error } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (error || !data) {
        codeExists = false;
      }
    }

    // Create the group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert([{
        name,
        invite_code: inviteCode,
        owner_id: userId
      }])
      .select()
      .single();

    if (groupError) throw groupError;

    // Update user's profile to join this group
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ group_id: groupData.id })
      .eq('id', userId);

    if (profileError) throw profileError;

    res.status(201).json({
      group: groupData,
      inviteCode
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join a group
router.post('/join', authMiddleware, async (req, res) => {
  const { inviteCode } = req.body;
  const userId = req.user.id;

  try {
    // Find the group by invite code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('invite_code', inviteCode)
      .single();

    if (groupError) throw groupError;
    if (!group) {
      return res.status(404).json({ error: 'Group not found or invalid invite code' });
    }

    // Check if user is already in a group
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    if (profile.group_id) {
      return res.status(409).json({ error: 'User is already in a group' });
    }

    // Join the group
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ group_id: group.id })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.json({
      message: 'Successfully joined group',
      group: { id: group.id, name: group.name }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user's group
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's profile to find their group
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    if (!profile.group_id) {
      return res.status(404).json({ error: 'User is not in a group' });
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', profile.group_id)
      .single();

    if (groupError) throw groupError;

    // Get all members in the group
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('group_id', profile.group_id);

    if (membersError) throw membersError;

    res.json({
      group,
      members,
      isOwner: group.owner_id === userId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leave current group
router.post('/leave', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's current group
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    if (!profile.group_id) {
      return res.status(404).json({ error: 'User is not in a group' });
    }

    // Check if user is the group owner
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', profile.group_id)
      .single();

    if (groupError) throw groupError;

    if (group.owner_id === userId) {
      return res.status(400).json({ error: 'Group owner cannot leave the group. Transfer ownership first.' });
    }

    // Leave the group
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ group_id: null })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;